import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays, subDays } from 'date-fns'
import { z } from 'zod'

const QueryParams = z.object({
  projectId: z.string().cuid(),
  days: z.coerce.number().int().min(1).max(90).default(7).optional(),
  includeCompetitors: z.coerce.boolean().default(true).optional(),
  timeWindow: z.enum(['HOUR_24', 'HOUR_48', 'DAY_7', 'DAY_30']).default('DAY_7').optional()
})

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const params = Object.fromEntries(url.searchParams.entries())
    
    const parsed = QueryParams.safeParse(params)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
    }

    const { projectId, days = 7, includeCompetitors = true, timeWindow = 'DAY_7' } = parsed.data
    const since = subDays(new Date(), days)

    // Fetch project with competitors
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

    // Build entity list
    const entities: Array<{ id: string; name: string; type: 'project' | 'competitor' }> = [
      { id: project.id, name: project.name, type: 'project' }
    ]

    if (includeCompetitors) {
      entities.push(...project.competitors.map(pc => ({
        id: pc.competitor.id,
        name: pc.competitor.name,
        type: 'competitor' as const
      })))
    }

    // Fetch hourly metrics for all entities
    const metrics = await prisma.conversationMetric.findMany({
      where: {
        OR: [
          { projectId },
          ...(includeCompetitors ? [{ competitor: { projects: { some: { projectId } } } }] : [])
        ],
        tsHour: { gte: since }
      },
      orderBy: { tsHour: 'asc' }
    })

    // Fetch recent mentions
    const mentions = await prisma.conversationMention.findMany({
      where: {
        OR: [
          { projectId },
          ...(includeCompetitors ? [{ competitor: { projects: { some: { projectId } } } }] : [])
        ],
        publishedAt: { gte: since }
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      include: {
        project: true,
        competitor: true
      }
    })

    // Fetch word cloud tokens
    const wordTokens = await prisma.wordCloudToken.findMany({
      where: {
        OR: [
          { projectId },
          ...(includeCompetitors ? [{ competitor: { projects: { some: { projectId } } } }] : [])
        ],
        timeWindow
      },
      orderBy: { frequency: 'desc' }
    })

    // Process metrics by entity and hour
    const metricsByEntity = new Map<string, Map<string, { volume: number; positive: number; negative: number }>>()
    
    for (const metric of metrics) {
      const entityId = metric.projectId || metric.competitorId || 'unknown'
      const hourKey = metric.tsHour.toISOString()
      
      if (!metricsByEntity.has(entityId)) {
        metricsByEntity.set(entityId, new Map())
      }
      
      const entityMetrics = metricsByEntity.get(entityId)!
      if (!entityMetrics.has(hourKey)) {
        entityMetrics.set(hourKey, { volume: 0, positive: 0, negative: 0 })
      }
      
      const hourMetrics = entityMetrics.get(hourKey)!
      
      switch (metric.kind) {
        case 'VOLUME':
          hourMetrics.volume = metric.value
          break
        case 'SENTIMENT_POS':
          hourMetrics.positive = metric.value
          break
        case 'SENTIMENT_NEG':
          hourMetrics.negative = metric.value
          break
      }
    }

    // Process word tokens by entity
    const tokensByEntity = new Map<string, Array<{ token: string; frequency: number; sentiment: string }>>()
    
    for (const token of wordTokens) {
      const entityId = token.projectId || token.competitorId || 'unknown'
      
      if (!tokensByEntity.has(entityId)) {
        tokensByEntity.set(entityId, [])
      }
      
      tokensByEntity.get(entityId)!.push({
        token: token.token,
        frequency: token.frequency,
        sentiment: token.sentiment
      })
    }

    // Calculate source breakdown
    const sourceBreakdown = new Map<string, number>()
    mentions.forEach(mention => {
      const source = mention.source
      sourceBreakdown.set(source, (sourceBreakdown.get(source) || 0) + 1)
    })

    // Build response
    const response = {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        keywords: project.keywords
      },
      entities: entities.map(entity => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        metrics: Array.from(metricsByEntity.get(entity.id)?.entries() || []).map(([hour, data]) => ({
          hour,
          ...data
        })),
        wordTokens: tokensByEntity.get(entity.id) || []
      })),
      recentMentions: mentions.map(mention => ({
        id: mention.id,
        url: mention.url,
        text: mention.text,
        source: mention.source,
        sentiment: mention.sentiment,
        sentimentScore: mention.sentimentScore,
        publishedAt: mention.publishedAt,
        entity: mention.project ? { name: mention.project.name, type: 'project' } : 
                mention.competitor ? { name: mention.competitor.name, type: 'competitor' } : null
      })),
      sourceBreakdown: Object.fromEntries(sourceBreakdown),
      timeRange: {
        from: since.toISOString(),
        to: new Date().toISOString(),
        days
      },
      timeWindow
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching conversation data:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
