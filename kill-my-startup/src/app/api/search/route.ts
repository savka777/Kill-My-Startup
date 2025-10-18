import { NextRequest, NextResponse } from 'next/server'
import Perplexity from '@perplexity-ai/perplexity_ai'
import { NewsCache } from '@/lib/news-cache'

export interface SearchRequest {
  userInfo?: string
  context?: string
  industry?: string
  max_results?: number
  forceRefresh?: boolean
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
    const body: SearchRequest = await request.json()
    const { userInfo, context, industry = 'AI/education', max_results = 10, forceRefresh = false } = body

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedNews = await NewsCache.getCachedNews({
        industry,
        userInfo,
        context,
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
          analysis: analyzeNewsForStartup(cachedNews.articles, context || industry),
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

    // Construct search queries based on user context
    let searchQuery: string | string[]
    
    if (userInfo && context) {
      // Personalized search based on user's startup idea
      searchQuery = [
        `${context} startup funding news 2024`,
        `${industry} market trends and competitors 2024`,
        `${context} business risks and challenges 2024`,
        `recent developments in ${industry} space 2024`
      ]
    } else {
      // Default search for general startup news
      searchQuery = [
        `recent news in ${industry} space 2024`,
        `startup funding trends ${industry} 2024`,
        `market analysis ${industry} competitors 2024`,
        `${industry} business failures and lessons 2024`
      ]
    }

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
      relevance: determineRelevance(result.title, context),
      tag: categorizeNews(result.title)
    }))

    // Store in cache for future requests
    if (newsItems.length > 0) {
      try {
        await NewsCache.storeNews({
          industry,
          userInfo,
          context,
          ttlHours: 6
        }, newsItems)
        console.log(`Cached ${newsItems.length} articles for future requests`)
      } catch (cacheError) {
        console.error('Failed to cache news:', cacheError)
        // Don't fail the request if caching fails
      }
    }

    // Analyze results for startup insights
    const analysis = analyzeNewsForStartup(newsItems, context || industry)
    
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

function determineRelevance(title: string, context?: string): string {
  if (!context) return 'General market insight'
  
  const titleLower = title.toLowerCase()
  const contextLower = context.toLowerCase()
  
  // Check for direct relevance
  if (titleLower.includes(contextLower)) {
    return `Direct match for ${context}`
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

function categorizeNews(title: string): string {
  const titleLower = title.toLowerCase()
  
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

function analyzeNewsForStartup(newsItems: NewsItem[], context: string): string {
  if (newsItems.length === 0) {
    return "No recent news found. This could indicate a very niche market or early-stage opportunity."
  }

  const fundingNews = newsItems.filter(item => item.tag === 'Funding')
  const riskNews = newsItems.filter(item => item.tag === 'Risk Alert')
  const marketNews = newsItems.filter(item => item.tag === 'Market Analysis')
  
  let analysis = `## News Analysis for: ${context}\n\n`
  
  analysis += `**📊 News Summary:**\n`
  analysis += `- Total articles: ${newsItems.length}\n`
  analysis += `- Funding news: ${fundingNews.length}\n`
  analysis += `- Market analysis: ${marketNews.length}\n`
  analysis += `- Risk signals: ${riskNews.length}\n\n`

  if (fundingNews.length > 0) {
    analysis += `**💰 Recent Funding Activity:**\n`
    fundingNews.slice(0, 2).forEach((item, index) => {
      analysis += `${index + 1}. ${item.title}\n`
    })
    analysis += `\n`
  }

  if (riskNews.length > 0) {
    analysis += `**⚠️ Risk Signals:**\n`
    riskNews.slice(0, 2).forEach((item, index) => {
      analysis += `${index + 1}. ${item.title}\n`
    })
    analysis += `\n`
  }

  analysis += `**🎯 Market Assessment:**\n`
  if (fundingNews.length > 3) {
    analysis += `High funding activity detected - competitive market with investor interest.`
  } else if (riskNews.length > 2) {
    analysis += `Multiple risk signals - market may be challenging or oversaturated.`
  } else if (newsItems.length < 5) {
    analysis += `Limited news coverage - either very niche market or early opportunity.`
  } else {
    analysis += `Moderate market activity - good timing for entry with proper execution.`
  }

  return analysis
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Perplexity Search API is running',
    timestamp: new Date().toISOString()
  })
}