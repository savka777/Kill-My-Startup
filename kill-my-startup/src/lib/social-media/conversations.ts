import { PrismaClient, ConversationSource, Sentiment, MetricKind, TimeWindow } from '@prisma/client'
import { addDays, subDays, subHours } from 'date-fns'

const prisma = new PrismaClient()

// Sample conversation data for testing
const sampleMentions = [
  // Google Search mentions
  {
    text: "Google Search is still the most reliable search engine, love how fast it is",
    sentiment: Sentiment.POSITIVE,
    sentimentScore: 0.8,
    source: ConversationSource.TWITTER,
    tokens: ["google", "search", "reliable", "fast", "love"]
  },
  {
    text: "Google Search results are getting worse, too many ads and sponsored content",
    sentiment: Sentiment.NEGATIVE,
    sentimentScore: -0.6,
    source: ConversationSource.REDDIT,
    tokens: ["google", "search", "results", "ads", "sponsored", "worse"]
  },
  {
    text: "Google Search vs other search engines - interesting comparison on HN",
    sentiment: Sentiment.NEUTRAL,
    sentimentScore: 0.1,
    source: ConversationSource.HACKER_NEWS,
    tokens: ["google", "search", "engines", "comparison"]
  },
  {
    text: "Google Search launched new features for developers",
    sentiment: Sentiment.POSITIVE,
    sentimentScore: 0.7,
    source: ConversationSource.PRODUCT_HUNT,
    tokens: ["google", "search", "features", "developers", "launched"]
  },
  {
    text: "Google Search is expensive for small businesses, need alternatives",
    sentiment: Sentiment.NEGATIVE,
    sentimentScore: -0.5,
    source: ConversationSource.FORUM,
    tokens: ["google", "search", "expensive", "businesses", "alternatives"]
  },

  // Perplexity AI mentions
  {
    text: "Perplexity AI is amazing, love how it provides sources and citations",
    sentiment: Sentiment.POSITIVE,
    sentimentScore: 0.9,
    source: ConversationSource.TWITTER,
    tokens: ["perplexity", "ai", "amazing", "sources", "citations", "love"]
  },
  {
    text: "Perplexity AI is expensive but worth it for research",
    sentiment: Sentiment.POSITIVE,
    sentimentScore: 0.6,
    source: ConversationSource.REDDIT,
    tokens: ["perplexity", "ai", "expensive", "research", "worth"]
  },
  {
    text: "Perplexity AI vs ChatGPT - detailed comparison on tech blogs",
    sentiment: Sentiment.NEUTRAL,
    sentimentScore: 0.0,
    source: ConversationSource.BLOG,
    tokens: ["perplexity", "ai", "chatgpt", "comparison", "tech"]
  },
  {
    text: "Perplexity AI raised $100M in Series A funding",
    sentiment: Sentiment.POSITIVE,
    sentimentScore: 0.8,
    source: ConversationSource.PRODUCT_HUNT,
    tokens: ["perplexity", "ai", "funding", "series", "raised"]
  },
  {
    text: "Perplexity AI is boring compared to other AI tools",
    sentiment: Sentiment.NEGATIVE,
    sentimentScore: -0.4,
    source: ConversationSource.FORUM,
    tokens: ["perplexity", "ai", "boring", "tools"]
  },

  // Brave Search mentions
  {
    text: "Brave Search is fast and privacy-focused, love it",
    sentiment: Sentiment.POSITIVE,
    sentimentScore: 0.8,
    source: ConversationSource.TWITTER,
    tokens: ["brave", "search", "fast", "privacy", "love"]
  },
  {
    text: "Brave Search results are not as comprehensive as Google",
    sentiment: Sentiment.NEGATIVE,
    sentimentScore: -0.3,
    source: ConversationSource.REDDIT,
    tokens: ["brave", "search", "results", "comprehensive", "google"]
  },
  {
    text: "Brave Search launched new privacy features",
    sentiment: Sentiment.POSITIVE,
    sentimentScore: 0.7,
    source: ConversationSource.HACKER_NEWS,
    tokens: ["brave", "search", "privacy", "features", "launched"]
  },
  {
    text: "Brave Search is free but has limited features",
    sentiment: Sentiment.NEUTRAL,
    sentimentScore: 0.1,
    source: ConversationSource.BLOG,
    tokens: ["brave", "search", "free", "limited", "features"]
  },
  {
    text: "Brave Search is reliable for daily use",
    sentiment: Sentiment.POSITIVE,
    sentimentScore: 0.6,
    source: ConversationSource.FORUM,
    tokens: ["brave", "search", "reliable", "daily", "use"]
  }
]

export async function seedConversationData() {
  console.log('🌱 Seeding conversation data...')

  // Create a test project
  let project = await prisma.project.findFirst({
    where: { name: 'Test Startup' }
  })
  
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Test Startup',
        description: 'A test startup for conversation tracking',
        keywords: ['startup', 'test', 'conversation', 'tracking']
      }
    })
  }

  // Create competitors
  const competitorNames = ['Google Search', 'Perplexity AI', 'Brave Search']
  const competitorDomains = ['google.com', 'perplexity.ai', 'search.brave.com']
  
  const competitors = await Promise.all(
    competitorNames.map(async (name, index) => {
      let competitor = await prisma.competitorProfile.findFirst({
        where: { name }
      })
      
      if (!competitor) {
        competitor = await prisma.competitorProfile.create({
          data: {
            name,
            website: competitorDomains[index] ? `https://${competitorDomains[index]}` : undefined,
            industry: 'Technology', // Default industry
            riskLevel: 'MEDIUM',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days TTL
          }
        })
      }
      
      return competitor
    })
  )

  // Link competitors to project
  await Promise.all(
    competitors.map(competitor =>
      prisma.projectCompetitor.upsert({
        where: {
          projectId_competitorId: {
            projectId: project.id,
            competitorId: competitor.id
          }
        },
        update: {},
        create: {
          projectId: project.id,
          competitorId: competitor.id
        }
      })
    )
  )

  // Generate mentions over the last 7 days
  const now = new Date()
  const mentions: any[] = []
  const metrics: any[] = []
  const wordTokens: any[] = []

  for (let i = 0; i < 7; i++) {
    const day = subDays(now, i)
    
    // Generate 3-5 mentions per day for each entity
    for (let j = 0; j < 4; j++) {
      const mention = sampleMentions[Math.floor(Math.random() * sampleMentions.length)]
      const publishedAt = new Date(day.getTime() + j * 6 * 60 * 60 * 1000) // 6 hours apart
      
      // Determine if this mention is about the project or a competitor
      const isProject = Math.random() < 0.3
      const competitor = competitors[Math.floor(Math.random() * competitors.length)]
      
      const url = `https://example.com/mention-${i}-${j}`
      
      mentions.push({
        projectId: isProject ? project.id : null,
        competitorId: isProject ? null : competitor.id,
        url,
        text: mention.text,
        tokens: mention.tokens,
        source: mention.source,
        publishedAt,
        sentiment: mention.sentiment,
        sentimentScore: mention.sentimentScore
      })
    }
  }

  // Create mentions
  await prisma.conversationMention.createMany({
    data: mentions,
    skipDuplicates: true
  })

  // Generate hourly metrics for the last 7 days
  for (let i = 0; i < 7 * 24; i++) {
    const hour = subHours(now, i)
    
    // Project metrics
    const projectMentions = mentions.filter(m => m.projectId === project.id && 
      Math.floor((now.getTime() - m.publishedAt.getTime()) / (1000 * 60 * 60)) === i)
    
    if (projectMentions.length > 0) {
      const positive = projectMentions.filter(m => m.sentiment === Sentiment.POSITIVE).length
      const negative = projectMentions.filter(m => m.sentiment === Sentiment.NEGATIVE).length
      
      metrics.push(
        { projectId: project.id, competitorId: null, kind: MetricKind.VOLUME, tsHour: hour, value: projectMentions.length },
        { projectId: project.id, competitorId: null, kind: MetricKind.SENTIMENT_POS, tsHour: hour, value: positive },
        { projectId: project.id, competitorId: null, kind: MetricKind.SENTIMENT_NEG, tsHour: hour, value: negative }
      )
    }

    // Competitor metrics
    for (const competitor of competitors) {
      const competitorMentions = mentions.filter(m => m.competitorId === competitor.id && 
        Math.floor((now.getTime() - m.publishedAt.getTime()) / (1000 * 60 * 60)) === i)
      
      if (competitorMentions.length > 0) {
        const positive = competitorMentions.filter(m => m.sentiment === Sentiment.POSITIVE).length
        const negative = competitorMentions.filter(m => m.sentiment === Sentiment.NEGATIVE).length
        
        metrics.push(
          { projectId: null, competitorId: competitor.id, kind: MetricKind.VOLUME, tsHour: hour, value: competitorMentions.length },
          { projectId: null, competitorId: competitor.id, kind: MetricKind.SENTIMENT_POS, tsHour: hour, value: positive },
          { projectId: null, competitorId: competitor.id, kind: MetricKind.SENTIMENT_NEG, tsHour: hour, value: negative }
        )
      }
    }
  }

  // Create metrics
  await prisma.conversationMetric.createMany({
    data: metrics,
    skipDuplicates: true
  })

  // Generate word cloud tokens
  const allTokens = new Map<string, { frequency: number; sentiment: Sentiment }>()
  
  mentions.forEach((mention: any) => {
    mention.tokens.forEach((token: string) => {
      const key = `${token}-${mention.sentiment}`
      if (!allTokens.has(key)) {
        allTokens.set(key, { frequency: 0, sentiment: mention.sentiment })
      }
      allTokens.get(key)!.frequency++
    })
  })

  // Create word cloud tokens for different time windows
  const timeWindows = [TimeWindow.HOUR_24, TimeWindow.HOUR_48, TimeWindow.DAY_7]
  
  for (const timeWindow of timeWindows) {
    // Project tokens
    const projectTokens = Array.from(allTokens.entries())
      .filter(([key, data]) => mentions.some(m => m.projectId === project.id && m.tokens.includes(key.split('-')[0])))
      .slice(0, 20)
      .map(([key, data]) => ({
        projectId: project.id,
        competitorId: null,
        token: key.split('-')[0],
        frequency: data.frequency,
        sentiment: data.sentiment,
        timeWindow
      }))

    if (projectTokens.length > 0) {
      await prisma.wordCloudToken.createMany({
        data: projectTokens,
        skipDuplicates: true
      })
    }

    // Competitor tokens
    for (const competitor of competitors) {
      const competitorTokens = Array.from(allTokens.entries())
        .filter(([key, data]) => mentions.some(m => m.competitorId === competitor.id && m.tokens.includes(key.split('-')[0])))
        .slice(0, 20)
        .map(([key, data]) => ({
          projectId: null,
          competitorId: competitor.id,
          token: key.split('-')[0],
          frequency: data.frequency,
          sentiment: data.sentiment,
          timeWindow
        }))

      if (competitorTokens.length > 0) {
        await prisma.wordCloudToken.createMany({
          data: competitorTokens,
          skipDuplicates: true
        })
      }
    }
  }

  console.log('✅ Conversation data seeded successfully!')
  console.log(`📊 Created ${mentions.length} mentions, ${metrics.length} metrics, and word cloud tokens`)
  
  return {
    project,
    competitors,
    mentionsCount: mentions.length,
    metricsCount: metrics.length
  }
}

// Run if called directly
if (require.main === module) {
  seedConversationData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error seeding data:', error)
      process.exit(1)
    })
}
