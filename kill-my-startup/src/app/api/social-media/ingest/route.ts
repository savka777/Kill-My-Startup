import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { projectId, since } = await req.json().catch(() => ({} as any))
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    }

    console.log(`Starting social media ingestion for project ${projectId}`)

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get active competitors
    const competitors = await prisma.competitor.findMany({
      where: { active: true },
      take: 5
    })

    const sinceDate = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const now = new Date()

    // Generate mock conversation metrics for the last 7 days
    const entityIds = [
      { id: projectId, type: 'project' as const },
      ...competitors.map(c => ({ id: c.id, type: 'competitor' as const }))
    ]

    let totalMentions = 0
    let totalMetrics = 0
    let totalTokens = 0

    for (const entity of entityIds) {
      // Generate hourly metrics for the past 7 days
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          const tsHour = new Date(now.getTime() - (d * 24 + h) * 60 * 60 * 1000)
          tsHour.setMinutes(0, 0, 0) // Round to hour

          if (tsHour < sinceDate) continue

          // Generate realistic metrics with some randomness
          const baseVolume = entity.type === 'project' ? 15 : Math.floor(Math.random() * 8) + 2
          const volume = Math.floor(baseVolume + Math.random() * 10)
          const positive = Math.floor(volume * (0.6 + Math.random() * 0.3))
          const negative = Math.floor(volume * (0.1 + Math.random() * 0.2))

          // Store volume metric
          await prisma.conversationMetric.upsert({
            where: {
              projectId_competitorId_tsHour_kind: {
                projectId: entity.type === 'project' ? entity.id : null,
                competitorId: entity.type === 'competitor' ? entity.id : null,
                tsHour,
                kind: 'VOLUME'
              }
            },
            update: { value: volume },
            create: {
              projectId: entity.type === 'project' ? entity.id : null,
              competitorId: entity.type === 'competitor' ? entity.id : null,
              tsHour,
              kind: 'VOLUME',
              value: volume
            }
          })

          // Store positive sentiment metric
          await prisma.conversationMetric.upsert({
            where: {
              projectId_competitorId_tsHour_kind: {
                projectId: entity.type === 'project' ? entity.id : null,
                competitorId: entity.type === 'competitor' ? entity.id : null,
                tsHour,
                kind: 'SENTIMENT_POS'
              }
            },
            update: { value: positive },
            create: {
              projectId: entity.type === 'project' ? entity.id : null,
              competitorId: entity.type === 'competitor' ? entity.id : null,
              tsHour,
              kind: 'SENTIMENT_POS',
              value: positive
            }
          })

          // Store negative sentiment metric
          await prisma.conversationMetric.upsert({
            where: {
              projectId_competitorId_tsHour_kind: {
                projectId: entity.type === 'project' ? entity.id : null,
                competitorId: entity.type === 'competitor' ? entity.id : null,
                tsHour,
                kind: 'SENTIMENT_NEG'
              }
            },
            update: { value: negative },
            create: {
              projectId: entity.type === 'project' ? entity.id : null,
              competitorId: entity.type === 'competitor' ? entity.id : null,
              tsHour,
              kind: 'SENTIMENT_NEG',
              value: negative
            }
          })

          totalMetrics += 3
        }
      }

      // Generate some recent mentions
      const mentionCount = Math.floor(Math.random() * 8) + 3
      for (let i = 0; i < mentionCount; i++) {
        const publishedAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        
        const mockTexts = [
          `Just tried ${entity.type === 'project' ? project.name : 'this new platform'} and it's pretty impressive!`,
          `Anyone else using ${entity.type === 'project' ? project.name : 'this tool'} for their workflow?`,
          `The AI features in ${entity.type === 'project' ? project.name : 'this app'} are game-changing`,
          `Comparing different options and ${entity.type === 'project' ? project.name : 'this one'} stands out`,
          `Mixed feelings about ${entity.type === 'project' ? project.name : 'this platform'} - great concept but needs work`,
          `Customer support at ${entity.type === 'project' ? project.name : 'this company'} is top notch`,
          `Beta testing ${entity.type === 'project' ? project.name : 'this new feature'} and loving it so far`
        ]

        const sources = ['reddit', 'twitter', 'hackernews', 'discord', 'linkedin']
        const sentiments = ['positive', 'negative', 'neutral']
        
        const text = mockTexts[Math.floor(Math.random() * mockTexts.length)]
        const source = sources[Math.floor(Math.random() * sources.length)]
        const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)]
        
        await prisma.conversationMention.create({
          data: {
            projectId: entity.type === 'project' ? entity.id : null,
            competitorId: entity.type === 'competitor' ? entity.id : null,
            url: `https://${source}.com/post/${Math.random().toString(36).substring(7)}`,
            text,
            source,
            sentiment,
            sentimentScore: sentiment === 'positive' ? 0.7 + Math.random() * 0.3 : 
                           sentiment === 'negative' ? -0.7 - Math.random() * 0.3 : 
                           -0.2 + Math.random() * 0.4,
            publishedAt
          }
        })

        totalMentions++
      }

      // Generate word cloud tokens
      const words = [
        'AI', 'innovative', 'helpful', 'easy', 'powerful', 'fast', 'reliable', 
        'intuitive', 'game-changer', 'efficient', 'smart', 'useful', 'impressive',
        'buggy', 'slow', 'confusing', 'expensive', 'limited', 'potential',
        'features', 'interface', 'design', 'performance', 'support', 'pricing'
      ]

      for (const word of words.slice(0, 15)) {
        const frequency = Math.floor(Math.random() * 50) + 5
        const sentiment = (Math.random() - 0.5) * 2 // -1 to 1
        
        await prisma.wordCloudToken.upsert({
          where: {
            projectId_competitorId_token_timeWindow: {
              projectId: entity.type === 'project' ? entity.id : null,
              competitorId: entity.type === 'competitor' ? entity.id : null,
              token: word,
              timeWindow: 'DAY_7'
            }
          },
          update: { 
            frequency: { increment: frequency },
            sentiment
          },
          create: {
            projectId: entity.type === 'project' ? entity.id : null,
            competitorId: entity.type === 'competitor' ? entity.id : null,
            token: word,
            frequency,
            sentiment,
            timeWindow: 'DAY_7'
          }
        })

        totalTokens++
      }
    }

    console.log(`Ingestion completed: ${totalMentions} mentions, ${totalMetrics} metrics, ${totalTokens} tokens`)

    return NextResponse.json({
      success: true,
      projectId,
      mentions: totalMentions,
      metrics: totalMetrics,
      tokens: totalTokens,
      timestamp: new Date().toISOString(),
      message: 'Social media data ingestion completed successfully'
    })

  } catch (error) {
    console.error('Error in conversations ingestion:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}