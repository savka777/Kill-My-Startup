import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Perplexity from '@perplexity-ai/perplexity_ai'
import { NewsCache } from '@/lib/news-cache'
import { prisma } from '@/lib/prisma'

export interface SearchRequest {
  max_results?: number
  forceRefresh?: boolean
}

export interface UserProfile {
  startupName: string
  startupDescription: string
  industry: string
  stage: string
  targetMarket: string
}

export interface NewsItem {
  title: string
  url: string
  date: string
  snippet?: string
  relevance: string
  tag: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: SearchRequest = await request.json()
    const { max_results = 10, forceRefresh = false } = body

    // Get user profile from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { profile: true }
    })

    if (!user || !user.profile) {
      return NextResponse.json({ error: "User profile not found. Please complete your intake form." }, { status: 404 })
    }

    const userProfile = user.profile
    const { startupName, startupDescription, industry, stage, targetMarket } = userProfile

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedNews = await NewsCache.getCachedNews({
        industry,
        userInfo: startupName,
        context: startupDescription,
        ttlHours: 6 // 6 hour cache
      })

      if (cachedNews) {
        console.log(`Serving ${cachedNews.articles.length} articles from cache for ${industry}`)
        
        return NextResponse.json({
          success: true,
          news: cachedNews.articles.map(article => ({
            title: article.title,
            url: article.url,
            date: article.date,
            snippet: article.snippet,
            relevance: article.relevance,
            tag: article.tag
          })),
          analysis: analyzeNewsForStartup(cachedNews.articles, startupName, userProfile, []),
          total_results: cachedNews.totalResults,
          fromCache: true,
          lastFetch: cachedNews.lastFetch
        })
      }
    }

    // Cache miss or force refresh - fetch from Perplexity
    const apiKey = process.env.PERPLEXITY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Perplexity API key not configured' },
        { status: 500 }
      )
    }

    const client = new Perplexity({
      apiKey: apiKey,
    })

    // First fetch competitors for this user's industry and context
    const competitors = await fetchCompetitors(userProfile)
    
    // Construct personalized search queries based on user profile and competitors
    const searchQuery = buildPersonalizedSearchQueries(userProfile, competitors)

    console.log('Fetching fresh news with queries:', searchQuery)

    const search = await client.search.create({
      query: searchQuery,
      max_results,
      return_snippets: true,
      country: "US"
    })

    console.log('Search completed, results:', search.results?.length || 0)

    // Transform results into news format for dashboard
    const newsItems: NewsItem[] = (search.results || []).map(result => ({
      title: result.title,
      url: result.url,
      date: result.date || 'Recent',
      snippet: result.snippet,
      relevance: determineRelevance(result.title, startupDescription, userProfile, competitors),
      tag: categorizeNews(result.title, competitors)
    }))

    // Store in cache for future requests
    if (newsItems.length > 0) {
      try {
        await NewsCache.storeNews({
          industry,
          userInfo: startupName,
          context: startupDescription,
          ttlHours: 6
        }, newsItems)
        console.log(`Cached ${newsItems.length} articles for future requests`)
      } catch (cacheError) {
        console.error('Failed to cache news:', cacheError)
        // Don't fail the request if caching fails
      }
    }

    // Analyze results for startup insights
    const analysis = analyzeNewsForStartup(newsItems, startupName, userProfile, competitors)
    
    return NextResponse.json({
      success: true,
      news: newsItems,
      analysis,
      total_results: search.results?.length || 0,
      fromCache: false,
      query: Array.isArray(searchQuery) ? searchQuery.join(', ') : searchQuery
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function fetchCompetitors(userProfile: UserProfile): Promise<string[]> {
  try {
    const { startupDescription, industry } = userProfile
    
    // Call the competitors API
    const competitorResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/competitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        industry,
        context: startupDescription,
        max_results: 6,
        forceRefresh: false
      })
    })
    
    if (competitorResponse.ok) {
      const data = await competitorResponse.json()
      return data.competitors?.map((comp: any) => comp.name).slice(0, 3) || []
    }
  } catch (error) {
    console.error('Failed to fetch competitors:', error)
  }
  
  return []
}

function buildPersonalizedSearchQueries(userProfile: UserProfile, competitors: string[]): string[] {
  const { startupName, startupDescription, industry, stage, targetMarket } = userProfile
  
  // Extract key terms from startup description
  const descriptionTerms = extractKeyTerms(startupDescription)
  
  // Clean and validate user inputs
  const cleanTargetMarket = targetMarket && targetMarket.toLowerCase() !== 'i do not know' ? targetMarket : null
  const hasValidDescription = descriptionTerms.length > 0 && !descriptionTerms.includes('know')
  
  const queries = [
    // Core industry and stage searches (always include)
    `${industry} startup funding news ${stage.toLowerCase().replace('_', ' ')} 2024`,
    `${industry} market trends competitors analysis 2024`,
    
    // Competitor-specific searches if we have competitors
    competitors.length > 0 
      ? `${competitors.slice(0, 2).join(' ')} news funding acquisition 2024`
      : (hasValidDescription ? `${descriptionTerms.join(' ')} startup news funding 2024` : `${industry} startup news 2024`),
    
    // Target market or stage-specific search
    cleanTargetMarket ? `${cleanTargetMarket} market ${industry} opportunities 2024` : getStageSpecificQuery(stage, industry),
    
    // Risk analysis with competitors if available
    competitors.length > 0 
      ? `${competitors[0]} ${industry} business challenges risks 2024`
      : `${industry} startup failures challenges lessons 2024`
  ].filter(Boolean) // Remove any null/undefined queries
  
  // Ensure we have exactly 5 queries (Perplexity limit)
  return queries.slice(0, 5)
}

function extractKeyTerms(description: string): string[] {
  // Simple keyword extraction - remove common words and get meaningful terms
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'that', 'this', 'these', 'those', 'we', 'our', 'us', 'you', 'your', 'they', 'them', 'their', 'it', 'its']
  
  return description
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 3) // Take top 3 meaningful terms
}

function getStageSpecificQuery(stage: string, industry: string): string {
  switch (stage) {
    case 'IDEA':
      return `${industry} startup idea validation market research 2024`
    case 'VALIDATING':
      return `${industry} startup validation customer discovery 2024`
    case 'BUILDING_MVP':
      return `${industry} MVP development startup funding pre-seed 2024`
    case 'LAUNCHED':
      return `${industry} startup launch product market fit 2024`
    case 'SCALING':
      return `${industry} startup scaling series A growth 2024`
    case 'ESTABLISHED':
      return `${industry} established startup acquisition IPO 2024`
    default:
      return `${industry} startup general news 2024`
  }
}

function determineRelevance(title: string, context: string, userProfile: UserProfile, competitors: string[]): string {
  const titleLower = title.toLowerCase()
  const contextLower = context.toLowerCase()
  const { startupName, industry, stage, targetMarket } = userProfile
  
  // Check for startup name match
  if (startupName && titleLower.includes(startupName.toLowerCase())) {
    return `Direct mention of ${startupName}`
  }
  
  // Check for competitor mentions (highest priority)
  for (const competitor of competitors) {
    if (titleLower.includes(competitor.toLowerCase())) {
      return `Competitor news: ${competitor}`
    }
  }
  
  // Check for direct context relevance
  if (titleLower.includes(contextLower)) {
    return `Direct match for your startup concept`
  }
  
  // Check for industry relevance
  if (titleLower.includes(industry.toLowerCase())) {
    return `${industry} industry news`
  }
  
  // Check for target market relevance
  if (targetMarket && titleLower.includes(targetMarket.toLowerCase())) {
    return `Target market: ${targetMarket}`
  }
  
  // Check for stage-specific relevance
  if (stage === 'IDEA' && (titleLower.includes('idea') || titleLower.includes('validation'))) {
    return 'Idea stage insights'
  }
  if (stage === 'BUILDING_MVP' && titleLower.includes('mvp')) {
    return 'MVP development insights'
  }
  if ((stage === 'LAUNCHED' || stage === 'SCALING') && titleLower.includes('scaling')) {
    return 'Scaling insights'
  }
  
  // Check for funding/competition signals
  if (titleLower.includes('funding') || titleLower.includes('raises') || titleLower.includes('series')) {
    return 'Funding activity in similar space'
  }
  
  // Check for market trends
  if (titleLower.includes('market') || titleLower.includes('growth') || titleLower.includes('trend')) {
    return 'Market trend analysis'
  }
  
  // Check for warnings
  if (titleLower.includes('fails') || titleLower.includes('shuts down') || titleLower.includes('closes')) {
    return 'Warning signal for industry'
  }
  
  return 'Related industry news'
}

function categorizeNews(title: string, competitors: string[] = []): string {
  const titleLower = title.toLowerCase()
  
  // Check for competitor mentions first
  for (const competitor of competitors) {
    if (titleLower.includes(competitor.toLowerCase())) {
      return 'Competitor News'
    }
  }
  
  if (titleLower.includes('funding') || titleLower.includes('raises') || titleLower.includes('investment')) {
    return 'Funding'
  }
  if (titleLower.includes('ai') || titleLower.includes('artificial intelligence')) {
    return 'AI Tech'
  }
  if (titleLower.includes('education') || titleLower.includes('learning') || titleLower.includes('student')) {
    return 'Education'
  }
  if (titleLower.includes('startup') || titleLower.includes('company')) {
    return 'Startup News'
  }
  if (titleLower.includes('market') || titleLower.includes('industry')) {
    return 'Market Analysis'
  }
  if (titleLower.includes('fail') || titleLower.includes('close') || titleLower.includes('shut')) {
    return 'Risk Alert'
  }
  
  return 'General'
}

function analyzeNewsForStartup(newsItems: NewsItem[], startupName: string, userProfile: UserProfile, competitors: string[]): string {
  if (newsItems.length === 0) {
    return "No recent news found. This could indicate a very niche market or early-stage opportunity."
  }

  const { industry, stage, targetMarket, startupDescription } = userProfile
  
  const fundingNews = newsItems.filter(item => item.tag === 'Funding')
  const riskNews = newsItems.filter(item => item.tag === 'Risk Alert')
  const marketNews = newsItems.filter(item => item.tag === 'Market Analysis')
  const competitorNews = newsItems.filter(item => item.tag === 'Competitor News')
  const aiTechNews = newsItems.filter(item => item.tag === 'AI Tech')
  
  // Analyze relevance to user's specific context
  const directMatches = newsItems.filter(item => 
    item.relevance.includes('Direct match') || 
    item.relevance.includes('Direct mention')
  )
  
  const competitorMatches = newsItems.filter(item => 
    item.relevance.includes('Competitor news')
  )
  
  const industrySpecific = newsItems.filter(item => 
    item.relevance.includes(industry) ||
    item.title.toLowerCase().includes(industry.toLowerCase())
  )
  
  let analysis = `## Personalized News Analysis for: ${startupName}\n\n`
  
  analysis += `**🎯 Your Startup Context:**\n`
  analysis += `- Industry: ${industry}\n`
  analysis += `- Stage: ${stage.replace('_', ' ')}\n`
  analysis += `- Target Market: ${targetMarket}\n`
  if (competitors.length > 0) {
    analysis += `- Key Competitors: ${competitors.join(', ')}\n`
  }
  analysis += `\n`
  
  analysis += `**📊 News Summary:**\n`
  analysis += `- Total articles: ${newsItems.length}\n`
  analysis += `- Direct relevance: ${directMatches.length}\n`
  analysis += `- Competitor mentions: ${competitorMatches.length}\n`
  analysis += `- Industry-specific: ${industrySpecific.length}\n`
  analysis += `- Funding news: ${fundingNews.length}\n`
  analysis += `- Market analysis: ${marketNews.length}\n`
  analysis += `- Risk signals: ${riskNews.length}\n\n`

  if (competitorMatches.length > 0) {
    analysis += `**🏆 Competitor Activity:**\n`
    competitorMatches.slice(0, 3).forEach((item, index) => {
      analysis += `${index + 1}. ${item.title} (${item.relevance})\n`
    })
    analysis += `\n`
  }

  if (directMatches.length > 0) {
    analysis += `**🎯 Highly Relevant News:**\n`
    directMatches.slice(0, 2).forEach((item, index) => {
      analysis += `${index + 1}. ${item.title} (${item.relevance})\n`
    })
    analysis += `\n`
  }

  if (fundingNews.length > 0) {
    analysis += `**💰 Recent Funding Activity in ${industry}:**\n`
    fundingNews.slice(0, 2).forEach((item, index) => {
      analysis += `${index + 1}. ${item.title}\n`
    })
    analysis += `\n`
  }

  if (riskNews.length > 0) {
    analysis += `**⚠️ Risk Signals in Your Space:**\n`
    riskNews.slice(0, 2).forEach((item, index) => {
      analysis += `${index + 1}. ${item.title}\n`
    })
    analysis += `\n`
  }

  // Stage-specific insights
  analysis += getStageSpecificInsights(stage, fundingNews, riskNews, newsItems.length)

  analysis += `**🎯 Market Assessment for ${startupName}:**\n`
  
  if (competitorMatches.length > 0) {
    analysis += `⚠️ **Competitor Activity Detected** - ${competitorMatches.length} competitor mentions found. `
    if (fundingNews.length > 0) {
      analysis += `Combined with funding activity, this indicates a competitive but investable market.`
    } else {
      analysis += `Monitor these competitors closely for market positioning opportunities.`
    }
  } else if (directMatches.length > 0) {
    analysis += `High relevance detected - this space is getting attention. Consider timing and differentiation.`
  } else if (fundingNews.length > 3) {
    analysis += `High funding activity in ${industry} - competitive market with investor interest.`
  } else if (riskNews.length > 2) {
    analysis += `Multiple risk signals in ${industry} - market may be challenging. Focus on solving real problems.`
  } else if (newsItems.length < 5) {
    analysis += `Limited news coverage in ${industry} - either very niche market or early opportunity.`
  } else {
    analysis += `Moderate market activity in ${industry} - good timing for entry with proper execution.`
  }
  
  // Add competitor-specific recommendations
  if (competitors.length > 0) {
    analysis += `\n\n**💡 Competitive Intelligence:**\n`
    analysis += `Monitor ${competitors.slice(0, 2).join(' and ')} for feature releases, funding announcements, and market positioning. `
    if (competitorMatches.length === 0) {
      analysis += `No recent news about your direct competitors suggests either quiet development or market opportunity.`
    } else {
      analysis += `Recent competitor activity suggests an active, evolving market landscape.`
    }
  }

  return analysis
}

function getStageSpecificInsights(stage: string, fundingNews: NewsItem[], riskNews: NewsItem[], totalNews: number): string {
  let insights = `**📈 Stage-Specific Insights (${stage.replace('_', ' ')}):**\n`
  
  switch (stage) {
    case 'IDEA':
      insights += `At the idea stage, focus on validation. `
      if (riskNews.length > 0) {
        insights += `Risk signals suggest careful market research is needed.`
      } else if (fundingNews.length > 0) {
        insights += `Funding activity indicates market interest - validate your unique angle.`
      } else {
        insights += `Limited activity could mean untapped opportunity or insufficient market need.`
      }
      break
      
    case 'VALIDATING':
      insights += `During validation, pay attention to market signals. `
      if (totalNews > 8) {
        insights += `High market activity suggests strong validation if you can differentiate.`
      } else {
        insights += `Consider if low news volume indicates niche opportunity or lack of market demand.`
      }
      break
      
    case 'BUILDING_MVP':
      insights += `MVP stage requires competitive awareness. `
      if (fundingNews.length > 2) {
        insights += `Active funding suggests you'll need strong MVP to compete for investor attention.`
      } else {
        insights += `Consider timing for fundraising as you approach MVP completion.`
      }
      break
      
    case 'LAUNCHED':
    case 'SCALING':
      insights += `Post-launch focus on growth and market position. `
      if (riskNews.length > 1) {
        insights += `Monitor risk signals closely as they may impact scaling plans.`
      } else if (fundingNews.length > 0) {
        insights += `Funding activity suggests opportunities for growth capital.`
      }
      break
      
    default:
      insights += `Monitor market trends and competitive landscape for strategic decisions.`
  }
  
  return insights + `\n\n`
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Perplexity Search API is running',
    timestamp: new Date().toISOString()
  })
}