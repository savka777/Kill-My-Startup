import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  fetchTwitterMentions, 
  fetchRedditMentions, 
  filterWithSonar,
  searchSpecificSites,
  searchGeneralSocial,
  analyzeSentiment,
  extractTokens
} from '@/lib/social-media/conversation'
import { ConversationSource, Sentiment, MetricKind, TimeWindow } from '@prisma/client'
import { startOfHour, subHours } from 'date-fns'

export async function POST(req: Request) {
  try {
    const { projectId, since } = await req.json().catch(() => ({} as any))
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    }

    // Fetch project and its competitors
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { 
        competitors: { 
          include: { competitor: true } 
        } 
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const entities = [
      { id: project.id, name: project.name, keywords: project.keywords, isProject: true },
      ...project.competitors.map(pc => ({
        id: pc.competitor.id,
        name: pc.competitor.name,
        keywords: [pc.competitor.name],
        isProject: false
      }))
    ]

    let totalMentions = 0
    let totalMetrics = 0
    let totalTokens = 0

    // Process each entity (project + competitors)
    for (const entity of entities) {
      console.log(`Processing ${entity.name}...`)

      // Strategy 1: Twitter & Reddit (RapidAPI + Perplexity Sonar)
      const twitterMentions = await fetchTwitterMentions(entity.name, since)
      const redditMentions = await fetchRedditMentions(entity.name, since)
      
      // Filter with Sonar
      const filteredTwitter = await filterWithSonar(twitterMentions)
      const filteredReddit = await filterWithSonar(redditMentions)

      // Strategy 2: Hacker News & Product Hunt (Perplexity Search)
      const hnPhMentions = await searchSpecificSites(entity.name, [
        'news.ycombinator.com',
        'producthunt.com'
      ])

      // Strategy 3: General Social Media (Perplexity Search)
      const generalMentions = await searchGeneralSocial(entity.name)

      // Combine all mentions
      const allMentions = [
        ...filteredTwitter,
        ...filteredReddit,
        ...hnPhMentions,
        ...generalMentions
      ]

      // Process and store mentions
      for (const mention of allMentions) {
        try {
          // Analyze sentiment and extract tokens
          const sentimentResult = await analyzeSentiment(mention.text)
          
          // Store mention
          await prisma.conversationMention.upsert({
            where: { url: mention.url },
            update: {
              text: mention.text,
              tokens: sentimentResult.tokens,
              sentiment: sentimentResult.sentiment,
              sentimentScore: sentimentResult.score,
              publishedAt: new Date(mention.publishedAt)
            },
            create: {
              projectId: entity.isProject ? entity.id : null,
              competitorId: entity.isProject ? null : entity.id,
              url: mention.url,
              text: mention.text,
              tokens: sentimentResult.tokens,
              source: mention.source,
              publishedAt: new Date(mention.publishedAt),
              sentiment: sentimentResult.sentiment,
              sentimentScore: sentimentResult.score
            }
          })

          totalMentions++
        } catch (error) {
          console.error(`Error processing mention ${mention.url}:`, error)
          continue
        }
      }
    }

    // Aggregate hourly metrics for the current hour
    const currentHour = startOfHour(new Date())
    
    for (const entity of entities) {
      // Get mentions for this hour
      const hourMentions = await prisma.conversationMention.findMany({
        where: {
          OR: [
            { projectId: entity.isProject ? entity.id : null },
            { competitorId: entity.isProject ? null : entity.id }
          ],
          publishedAt: {
            gte: currentHour,
            lt: new Date(currentHour.getTime() + 60 * 60 * 1000)
          }
        }
      })

      if (hourMentions.length > 0) {
        const positive = hourMentions.filter(m => m.sentiment === Sentiment.POSITIVE).length
        const negative = hourMentions.filter(m => m.sentiment === Sentiment.NEGATIVE).length

        // Store metrics - use separate logic for project vs competitor
        if (entity.isProject) {
          await Promise.all([
            prisma.conversationMetric.upsert({
              where: {
                project_metric_unique: {
                  projectId: entity.id,
                  kind: MetricKind.VOLUME,
                  tsHour: currentHour
                }
              },
              update: { value: hourMentions.length },
              create: {
                projectId: entity.id,
                competitorId: null,
                kind: MetricKind.VOLUME,
                tsHour: currentHour,
                value: hourMentions.length
              }
            }),
            prisma.conversationMetric.upsert({
              where: {
                project_metric_unique: {
                  projectId: entity.id,
                  kind: MetricKind.SENTIMENT_POS,
                  tsHour: currentHour
                }
              },
              update: { value: positive },
              create: {
                projectId: entity.id,
                competitorId: null,
                kind: MetricKind.SENTIMENT_POS,
                tsHour: currentHour,
                value: positive
              }
            }),
            prisma.conversationMetric.upsert({
              where: {
                project_metric_unique: {
                  projectId: entity.id,
                  kind: MetricKind.SENTIMENT_NEG,
                  tsHour: currentHour
                }
              },
              update: { value: negative },
              create: {
                projectId: entity.id,
                competitorId: null,
                kind: MetricKind.SENTIMENT_NEG,
                tsHour: currentHour,
                value: negative
              }
            })
          ])
        } else {
          await Promise.all([
            prisma.conversationMetric.upsert({
              where: {
                competitor_metric_unique: {
                  competitorId: entity.id,
                  kind: MetricKind.VOLUME,
                  tsHour: currentHour
                }
              },
              update: { value: hourMentions.length },
              create: {
                projectId: null,
                competitorId: entity.id,
                kind: MetricKind.VOLUME,
                tsHour: currentHour,
                value: hourMentions.length
              }
            }),
            prisma.conversationMetric.upsert({
              where: {
                competitor_metric_unique: {
                  competitorId: entity.id,
                  kind: MetricKind.SENTIMENT_POS,
                  tsHour: currentHour
                }
              },
              update: { value: positive },
              create: {
                projectId: null,
                competitorId: entity.id,
                kind: MetricKind.SENTIMENT_POS,
                tsHour: currentHour,
                value: positive
              }
            }),
            prisma.conversationMetric.upsert({
              where: {
                competitor_metric_unique: {
                  competitorId: entity.id,
                  kind: MetricKind.SENTIMENT_NEG,
                  tsHour: currentHour
                }
              },
              update: { value: negative },
              create: {
                projectId: null,
                competitorId: entity.id,
                kind: MetricKind.SENTIMENT_NEG,
                tsHour: currentHour,
                value: negative
              }
            })
          ])
        }

        totalMetrics += 3
      }

      // Generate word cloud tokens for different time windows
      const timeWindows = [TimeWindow.HOUR_24, TimeWindow.HOUR_48, TimeWindow.DAY_7]
      
      for (const timeWindow of timeWindows) {
        const cutoffTime = timeWindow === TimeWindow.HOUR_24 ? subHours(currentHour, 24) :
                          timeWindow === TimeWindow.HOUR_48 ? subHours(currentHour, 48) :
                          subHours(currentHour, 24 * 7)

        const recentMentions = await prisma.conversationMention.findMany({
          where: {
            OR: [
              { projectId: entity.isProject ? entity.id : null },
              { competitorId: entity.isProject ? null : entity.id }
            ],
            publishedAt: { gte: cutoffTime }
          }
        })

        if (recentMentions.length > 0) {
          // Count token frequencies
          const tokenCounts = new Map<string, { frequency: number; sentiment: Sentiment }>()
          
          recentMentions.forEach(mention => {
            mention.tokens.forEach(token => {
              const key = `${token}-${mention.sentiment}`
              if (!tokenCounts.has(key)) {
                tokenCounts.set(key, { frequency: 0, sentiment: mention.sentiment })
              }
              tokenCounts.get(key)!.frequency++
            })
          })

          // Store top tokens
          const topTokens = Array.from(tokenCounts.entries())
            .sort((a, b) => b[1].frequency - a[1].frequency)
            .slice(0, 20)

          for (const [key, data] of topTokens) {
            const token = key.split('-')[0]
            
            if (entity.isProject) {
              await prisma.wordCloudToken.upsert({
                where: {
                  project_token_unique: {
                    projectId: entity.id,
                    token,
                    timeWindow
                  }
                },
                update: { 
                  frequency: data.frequency,
                  sentiment: data.sentiment
                },
                create: {
                  projectId: entity.id,
                  competitorId: null,
                  token,
                  frequency: data.frequency,
                  sentiment: data.sentiment,
                  timeWindow
                }
              })
            } else {
              await prisma.wordCloudToken.upsert({
                where: {
                  competitor_token_unique: {
                    competitorId: entity.id,
                    token,
                    timeWindow
                  }
                },
                update: { 
                  frequency: data.frequency,
                  sentiment: data.sentiment
                },
                create: {
                  projectId: null,
                  competitorId: entity.id,
                  token,
                  frequency: data.frequency,
                  sentiment: data.sentiment,
                  timeWindow
                }
              })
            }

            totalTokens++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      projectId,
      mentions: totalMentions,
      metrics: totalMetrics,
      tokens: totalTokens,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in conversations ingestion:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
