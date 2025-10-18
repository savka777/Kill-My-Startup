import { NextRequest, NextResponse } from 'next/server'
import Perplexity from '@perplexity-ai/perplexity_ai'
import { CompetitorCache, type CompetitorData } from '@/lib/competitor-cache'

export interface CompetitorSearchRequest {
  industry: string
  context?: string
  userInfo?: string
  max_results?: number
  forceRefresh?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body: CompetitorSearchRequest = await request.json()
    const { industry, context, userInfo, max_results = 8, forceRefresh = false } = body

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedCompetitors = await CompetitorCache.getCachedCompetitors({
        industry,
        context,
        userInfo,
        ttlHours: 12 // 12 hour cache for competitors
      })

      if (cachedCompetitors) {
        console.log(`Serving ${cachedCompetitors.competitors.length} competitors from cache for ${industry}`)
        
        return NextResponse.json({
          success: true,
          competitors: cachedCompetitors.competitors,
          total_competitors: cachedCompetitors.totalCompetitors,
          fromCache: true,
          lastFetch: cachedCompetitors.lastFetch
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

    // Construct competitor-specific search queries
    const competitorQueries = generateCompetitorQueries(industry, context, userInfo)
    
    console.log('Fetching fresh competitor data with queries:', competitorQueries)

    const search = await client.search.create({
      query: competitorQueries,
      max_results,
      return_snippets: true,
      country: "US"
    })

    console.log('Competitor search completed, results:', search.results?.length || 0)

    // Parse and structure competitor data from search results
    const competitors = await parseCompetitorData(search.results || [], industry)
    
    // Store in cache for future requests
    if (competitors.length > 0) {
      try {
        await CompetitorCache.storeCompetitors({
          industry,
          context,
          userInfo,
          ttlHours: 12
        }, competitors)
        console.log(`Cached ${competitors.length} competitors for future requests`)
      } catch (cacheError) {
        console.error('Failed to cache competitors:', cacheError)
        // Don't fail the request if caching fails
      }
    }
    
    return NextResponse.json({
      success: true,
      competitors: competitors.map(comp => ({
        id: comp.id || Math.random().toString(36).substring(7),
        name: comp.name,
        description: comp.description,
        website: comp.website,
        industry: comp.industry,
        foundedYear: comp.foundedYear,
        employeeCount: comp.employeeCount,
        lastFunding: comp.lastFunding,
        fundingAmount: comp.fundingAmount,
        recentNews: comp.recentNews,
        riskLevel: comp.riskLevel
      })),
      total_competitors: competitors.length,
      fromCache: false
    })

  } catch (error) {
    console.error('Competitor search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateCompetitorQueries(industry: string, context?: string, userInfo?: string): string[] {
  const baseQueries = [
    `list of companies in ${industry} industry 2024`,
    `${industry} startups companies founded 2023 2024`,
    `major players ${industry} market companies`,
    `${industry} software companies products platforms`
  ]

  // Add context-specific query if provided
  if (context) {
    baseQueries.push(`companies building ${context} tools ${industry}`)
  } else {
    // If no context, add a generic query
    baseQueries.push(`unicorn companies ${industry} billion valuation`)
  }

  // Ensure we never exceed 5 queries (Perplexity limit)
  return baseQueries.slice(0, 5)
}

async function parseCompetitorData(
  searchResults: any[], 
  industry: string
): Promise<Array<{
  id?: string
  name: string
  description?: string
  website?: string
  industry: string
  foundedYear?: number
  employeeCount?: string
  lastFunding?: string
  fundingAmount?: string
  recentNews?: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}>> {
  const competitors: any[] = []
  const seenCompanies = new Set<string>()

  for (const result of searchResults) {
    const title = result.title.toLowerCase()
    const snippet = result.snippet || ''
    
    // Extract company name from title
    const companyName = extractCompanyName(result.title, result.snippet)
    if (!companyName || seenCompanies.has(companyName.toLowerCase())) {
      continue
    }
    
    seenCompanies.add(companyName.toLowerCase())
    
    // Determine risk level based on content
    const riskLevel = determineRiskLevel(title, snippet)
    
    // Extract funding information
    const fundingInfo = extractFundingInfo(title, snippet)
    
    // Extract recent news
    const recentNews = extractRecentNews(title, snippet)
    
    competitors.push({
      name: companyName,
      description: snippet.substring(0, 200) + (snippet.length > 200 ? '...' : ''),
      website: extractWebsite(result.url),
      industry,
      lastFunding: fundingInfo.lastFunding,
      fundingAmount: fundingInfo.fundingAmount,
      recentNews,
      riskLevel
    })
  }

  return competitors.slice(0, 6) // Limit to top 6 competitors
}

function extractCompanyName(title: string, snippet: string): string | null {
  // Enhanced patterns for extracting company names from search results
  const patterns = [
    // Direct company mentions at start
    /^([A-Z][a-zA-Z0-9\s&.]+?)(?:\s+(?:is|has|was|will|announced|launched|raised|founded|offers|provides|builds|creates))/i,
    // Company followed by descriptive terms
    /([A-Z][a-zA-Z0-9\s&.]+?)(?:\s+(?:AI|startup|company|platform|software|app|tool|service|Inc|Corp|Ltd|LLC))/i,
    // Company followed by punctuation
    /^([A-Z][a-zA-Z0-9\s&.]+?)(?:\s*[:,-])/i,
    // Companies in listings
    /(?:^|\s)([A-Z][a-zA-Z0-9\s&.]{2,25})(?=\s+(?:founded|based|headquartered|offers|provides|specializes))/i,
    // URL-based extraction
    /(?:https?:\/\/(?:www\.)?)?([a-zA-Z0-9][a-zA-Z0-9\-]{1,61}[a-zA-Z0-9])\.(?:com|io|ai|co|net|org)/i
  ]
  
  const content = title + ' ' + snippet
  
  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      let name = match[1].trim()
      // Clean up common prefixes/suffixes
      name = name.replace(/^(The|A)\s+/i, '')
      name = name.replace(/\s+(Inc|Corp|Ltd|LLC|AI|Platform|Software|App)$/i, '')
      
      // Skip if too generic
      const genericTerms = /^(startup|company|platform|software|app|tool|service|solution|system|product)$/i
      if (!genericTerms.test(name) && name.length > 2 && name.length < 30) {
        return name
      }
    }
  }
  
  return null
}

function determineRiskLevel(title: string, snippet: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const content = (title + ' ' + snippet).toLowerCase()
  
  // Critical risk indicators
  if (content.includes('unicorn') || 
      content.includes('billion') || 
      content.includes('series c') || 
      content.includes('series d') ||
      content.includes('ipo')) {
    return 'CRITICAL'
  }
  
  // High risk indicators
  if (content.includes('series b') || 
      content.includes('100m') || 
      content.includes('market leader') ||
      content.includes('acquires') ||
      content.includes('partnership')) {
    return 'HIGH'
  }
  
  // Medium risk indicators
  if (content.includes('series a') || 
      content.includes('funding') || 
      content.includes('raises') ||
      content.includes('grows') ||
      content.includes('expands')) {
    return 'MEDIUM'
  }
  
  return 'LOW'
}

function extractFundingInfo(title: string, snippet: string): { 
  lastFunding?: string, 
  fundingAmount?: string 
} {
  const content = title + ' ' + snippet
  
  // Extract funding round
  const roundMatch = content.match(/(series [a-z]|seed|pre-seed)/i)
  const lastFunding = roundMatch ? roundMatch[1] : undefined
  
  // Extract funding amount
  const amountMatch = content.match(/\$(\d+(?:\.\d+)?)\s*(million|billion|m|b)/i)
  const fundingAmount = amountMatch ? `$${amountMatch[1]}${amountMatch[2].charAt(0).toUpperCase()}` : undefined
  
  return { lastFunding, fundingAmount }
}

function extractRecentNews(title: string, snippet: string): string {
  return title.length > 100 ? title.substring(0, 100) + '...' : title
}

function extractWebsite(url: string): string | undefined {
  try {
    const domain = new URL(url).hostname
    // If it's from news sites, don't return as company website
    const newsSites = ['techcrunch.com', 'venturebeat.com', 'forbes.com', 'bloomberg.com']
    if (newsSites.some(site => domain.includes(site))) {
      return undefined
    }
    return domain
  } catch {
    return undefined
  }
}

// GET endpoint for health check
export async function GET() {
  try {
    const stats = await CompetitorCache.getCacheStats()
    
    return NextResponse.json({
      status: 'ok',
      message: 'Competitor API is running',
      stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to get stats',
      timestamp: new Date().toISOString()
    })
  }
}