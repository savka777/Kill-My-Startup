const { PrismaClient } = require('@prisma/client')

async function checkSocialMediaData() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking Social Media Data Storage...\n')
    
    // Check ConversationMention table
    const mentions = await prisma.conversationMention.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('📊 ConversationMention Records:')
    console.log(`  - Total mentions: ${mentions.length}`)
    
    if (mentions.length > 0) {
      console.log('\n📝 Recent Mentions:')
      mentions.forEach((mention, index) => {
        console.log(`  ${index + 1}. ${mention.source} - ${mention.text?.substring(0, 50)}...`)
        console.log(`     URL: ${mention.url}`)
        console.log(`     Created: ${mention.createdAt}`)
        console.log(`     Sentiment: ${mention.sentiment} (${mention.sentimentScore})`)
        console.log(`     Tokens: ${mention.tokens.length}`)
        console.log('')
      })
    } else {
      console.log('  ❌ No mentions found in database')
    }
    
    // Check ConversationMetric table
    const metrics = await prisma.conversationMetric.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('📈 ConversationMetric Records:')
    console.log(`  - Total metrics: ${metrics.length}`)
    
    if (metrics.length > 0) {
      console.log('\n📊 Recent Metrics:')
      metrics.forEach((metric, index) => {
        console.log(`  ${index + 1}. ${metric.kind} - ${metric.value}`)
        console.log(`     Created: ${metric.createdAt}`)
        console.log('')
      })
    } else {
      console.log('  ❌ No metrics found in database')
    }
    
    // Check WordCloudToken table
    const wordTokens = await prisma.wordCloudToken.findMany({
      take: 20,
      orderBy: { frequency: 'desc' }
    })
    
    console.log('☁️ WordCloudToken Records:')
    console.log(`  - Total tokens: ${wordTokens.length}`)
    
    if (wordTokens.length > 0) {
      console.log('\n🔤 Top Word Tokens:')
      wordTokens.slice(0, 10).forEach((token, index) => {
        console.log(`  ${index + 1}. "${token.token}" - Frequency: ${token.frequency}`)
      })
    } else {
      console.log('  ❌ No word tokens found in database')
    }
    
    // Check by source breakdown
    const sourceBreakdown = await prisma.conversationMention.groupBy({
      by: ['source'],
      _count: {
        source: true
      }
    })
    
    console.log('\n📱 Source Breakdown:')
    sourceBreakdown.forEach(source => {
      console.log(`  - ${source.source}: ${source._count.source} mentions`)
    })
    
    // Check sentiment analysis
    const sentimentBreakdown = await prisma.conversationMetric.groupBy({
      by: ['kind'],
      _count: {
        kind: true
      }
    })
    
    console.log('\n😊 Sentiment Analysis:')
    sentimentBreakdown.forEach(sentiment => {
      console.log(`  - ${sentiment.kind}: ${sentiment._count.kind} metrics`)
    })
    
    // Test the social media query API
    console.log('\n🧪 Testing Social Media Query API...')
    try {
      const response = await fetch('http://localhost:3000/api/social-media/query?projectId=cmgvqp51q0000ihc3b4f0d3tv&days=7&includeCompetitors=true')
      const data = await response.json()
      
      if (response.ok) {
        console.log('✅ Social Media Query API Response:')
        console.log(`  - Success: ${data.success}`)
        console.log(`  - Project: ${data.project?.name}`)
        console.log(`  - Entities: ${data.entities?.length || 0}`)
        console.log(`  - Recent Mentions: ${data.recentMentions?.length || 0}`)
        console.log(`  - Sentiment Analysis: ${data.sentimentAnalysis ? 'Available' : 'Not Available'}`)
        console.log(`  - Word Cloud: ${data.wordCloud ? 'Available' : 'Not Available'}`)
        console.log(`  - Source Breakdown: ${data.sourceBreakdown ? 'Available' : 'Not Available'}`)
      } else {
        console.log('❌ Social Media Query API Error:', data.error)
      }
    } catch (error) {
      console.log('❌ Error testing API:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Error checking social media data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSocialMediaData()
