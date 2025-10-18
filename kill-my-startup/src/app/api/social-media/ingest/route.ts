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

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get ALL active competitors from CompetitorProfile table
    const competitors = await prisma.competitorProfile.findMany({
      where: {
        expiresAt: { gt: new Date() } // Only active competitors
      },
      orderBy: [
        { riskLevel: 'desc' }, // CRITICAL first, then HIGH, MEDIUM, LOW
        { createdAt: 'desc' }  // Most recent first
      ],
      take: 15 // Get more competitors for better coverage
    })

    // For each competitor profile, create or find the corresponding Competitor record
    const competitorEntities = []
    for (const compProfile of competitors) {
      // Try to find existing competitor record
      let competitor = await prisma.competitor.findFirst({
        where: { name: compProfile.name }
      })

      // If not found, create one
      if (!competitor) {
        competitor = await prisma.competitor.create({
          data: {
            name: compProfile.name,
            domain: compProfile.website,
            active: true
          }
        })
      }

      competitorEntities.push({
        id: competitor.id,
        name: competitor.name,
        keywords: [competitor.name],
        isProject: false
      })
    }

    const entities = [
      { id: project.id, name: project.name, keywords: project.keywords, isProject: true },
      ...competitorEntities
    ]

    let totalMentions = 0
    let totalMetrics = 0
    let totalTokens = 0

    // Process each entity (project + competitors)
    for (const entity of entities) {
      console.log(`Processing ${entity.name}...`)

      // For competitors, use more generic search terms
      const searchTerms = entity.isProject 
        ? [entity.name] // Use exact name for projects
        : [
            entity.name, // Try exact name first
            entity.name.split(' ')[0], // Try first word (e.g., "Google" from "Google (Gemini Guided Learning)")
            entity.name.split('(')[0].trim(), // Try name without parentheses (e.g., "Google" from "Google (Gemini Guided Learning)")
            ...entity.name.split(' ').filter(word => word.length > 3) // Try individual significant words
          ].filter((term, index, arr) => arr.indexOf(term) === index) // Remove duplicates

      let allMentions: any[] = []

      // Search with each term
      for (const searchTerm of searchTerms) {
        console.log(`  Searching for "${searchTerm}"...`)

        // Strategy 1: Twitter & Reddit (RapidAPI + Perplexity Sonar)
        const twitterMentions = await fetchTwitterMentions(searchTerm, since)
        const redditMentions = await fetchRedditMentions(searchTerm, since)
        
        // Filter with Sonar
        const filteredTwitter = await filterWithSonar(twitterMentions)
        const filteredReddit = await filterWithSonar(redditMentions)

        // Strategy 2: Hacker News & Product Hunt (Perplexity Search)
        const hnPhMentions = await searchSpecificSites(searchTerm, [
          'news.ycombinator.com',
          'producthunt.com'
        ])

        // Strategy 3: General Social Media (Perplexity Search)
        const generalMentions = await searchGeneralSocial(searchTerm)

        // Combine mentions for this search term
        const termMentions = [
          ...filteredTwitter,
          ...filteredReddit,
          ...hnPhMentions,
          ...generalMentions
        ]

        allMentions.push(...termMentions)
        console.log(`    Found ${termMentions.length} mentions for "${searchTerm}"`)
      }

      // Remove duplicate mentions by URL
      const uniqueMentions = allMentions.filter((mention, index, arr) => 
        arr.findIndex(m => m.url === mention.url) === index
      )

      console.log(`  Total unique mentions for ${entity.name}: ${uniqueMentions.length}`)

      // Process and store mentions
      for (const mention of uniqueMentions) {
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
