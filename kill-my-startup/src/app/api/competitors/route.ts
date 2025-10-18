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
        valuation: comp.valuation,
        lastFunding: comp.lastFunding,
        fundingAmount: comp.fundingAmount,
        stage: comp.stage,
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
  // Extract key concepts from the startup description for similarity matching
  const keywords = context ? extractKeywords(context) : []
  
  const baseQueries = [
    // Direct similarity search regardless of stage
    `companies building ${keywords.length > 0 ? keywords.join(' ') : industry} solutions platforms tools`,
    `${industry} companies similar products services all stages startup to enterprise`,
    `list companies ${industry} space valuation website from seed to public`,
    `competitors ${industry} market all sizes startups unicorns established players`,
    `${industry} platforms tools companies website funding any stage size`
  ]

  // Ensure we never exceed 5 queries (Perplexity limit)
  return baseQueries.slice(0, 5)
}

function extractKeywords(description: string): string[] {
  if (!description) return []
  
  // Remove common startup words and extract meaningful terms
  const commonWords = [
    'startup', 'company', 'platform', 'app', 'tool', 'software', 'service', 'solution',
    'building', 'creating', 'developing', 'making', 'helps', 'allows', 'enables',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
  ]
  
  return description
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word))
    .slice(0, 2) // Take top 2 meaningful terms for similarity
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
  valuation?: string
  lastFunding?: string
  fundingAmount?: string
  stage?: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}>> {
  const competitors: any[] = []
  const seenCompanies = new Set<string>()

  for (const result of searchResults) {
    const title = result.title.toLowerCase()
    const snippet = result.snippet || ''
    const content = title + ' ' + snippet
    
    // Extract company name from title
    const companyName = extractCompanyName(result.title, result.snippet)
    if (!companyName || seenCompanies.has(companyName.toLowerCase())) {
      continue
    }
    
    seenCompanies.add(companyName.toLowerCase())
    
    // Extract company website (prioritize actual company domains)
    const website = extractCompanyWebsite(result.url, content, companyName)
    
    // Determine risk level based on company size/funding
    const riskLevel = determineCompetitorRisk(content)
    
    // Extract valuation information
    const valuation = extractValuation(content)
    
    // Extract funding information
    const fundingInfo = extractFundingInfo(title, snippet)
    
    // Extract founding year
    const foundedYear = extractFoundedYear(content)
    
    // Extract employee count
    const employeeCount = extractEmployeeCount(content)
    
    // Determine company stage
    const stage = determineCompanyStage(content, valuation, fundingInfo.fundingAmount)
    
    competitors.push({
      name: companyName,
      description: generateCompanyDescription(snippet, companyName, industry),
      website,
      industry,
      foundedYear,
      employeeCount,
      valuation,
      lastFunding: fundingInfo.lastFunding,
      fundingAmount: fundingInfo.fundingAmount,
      stage,
      riskLevel
    })
  }

  // Sort by diversity of stages and threat levels to get good mix
  const sortedCompetitors = competitors.sort((a, b) => {
    // Prioritize companies with valuation data
    if (a.valuation && !b.valuation) return -1
    if (!a.valuation && b.valuation) return 1
    
    // Then prioritize variety in threat levels
    const threatOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
    return threatOrder[b.riskLevel] - threatOrder[a.riskLevel]
  })
  
  return sortedCompetitors.slice(0, 8) // Limit to top 8 competitors
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

function extractValuation(content: string): string | undefined {
  const valuationPatterns = [
    // Billion dollar valuations
    /\$(\d+(?:\.\d+)?)\s*billion/i,
    /(\d+(?:\.\d+)?)\s*billion\s*valuation/i,
    /valued\s*at\s*\$?(\d+(?:\.\d+)?)\s*billion/i,
    
    // Million dollar valuations
    /\$(\d+(?:\.\d+)?)\s*million\s*valuation/i,
    /valued\s*at\s*\$?(\d+(?:\.\d+)?)\s*million/i,
    
    // Market cap
    /market\s*cap\s*\$?(\d+(?:\.\d+)?)\s*(billion|million)/i,
    
    // Unicorn references
    /unicorn/i
  ]
  
  for (const pattern of valuationPatterns) {
    const match = content.match(pattern)
    if (match) {
      if (match[0].toLowerCase().includes('unicorn')) {
        return '$1B+'
      }
      if (match[2] === 'billion' || match[0].includes('billion')) {
        return `$${match[1]}B`
      }
      if (match[2] === 'million' || match[0].includes('million')) {
        return `$${match[1]}M`
      }
    }
  }
  
  return undefined
}

function extractFoundedYear(content: string): number | undefined {
  const yearPatterns = [
    /founded\s*in\s*(\d{4})/i,
    /established\s*in\s*(\d{4})/i,
    /started\s*in\s*(\d{4})/i,
    /since\s*(\d{4})/i
  ]
  
  for (const pattern of yearPatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      const year = parseInt(match[1])
      if (year >= 1990 && year <= new Date().getFullYear()) {
        return year
      }
    }
  }
  
  return undefined
}

function extractEmployeeCount(content: string): string | undefined {
  const employeePatterns = [
    /(\d+(?:,\d+)*)\s*employees/i,
    /team\s*of\s*(\d+(?:,\d+)*)/i,
    /(\d+(?:,\d+)*)\s*people/i,
    /(\d+)\+\s*employees/i
  ]
  
  for (const pattern of employeePatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      const count = match[1].replace(',', '')
      const num = parseInt(count)
      if (num > 5 && num < 1000000) {
        if (num >= 10000) return '10,000+'
        if (num >= 1000) return '1,000+'
        if (num >= 500) return '500+'
        if (num >= 100) return '100+'
        if (num >= 50) return '50+'
        return `${num}`
      }
    }
  }
  
  return undefined
}

function extractCompanyWebsite(url: string, content: string, companyName: string): string | undefined {
  // Try to extract from URL first
  try {
    const domain = new URL(url).hostname
    
    // Skip news sites and other non-company domains
    const excludeDomains = [
      'techcrunch.com', 'venturebeat.com', 'forbes.com', 'bloomberg.com',
      'crunchbase.com', 'linkedin.com', 'twitter.com', 'facebook.com',
      'wikipedia.org', 'google.com', 'youtube.com', 'medium.com'
    ]
    
    if (!excludeDomains.some(excluded => domain.includes(excluded))) {
      // Check if domain might be related to company name
      const simpleName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
      const simpleDomain = domain.replace(/[^a-z0-9]/g, '')
      
      if (simpleDomain.includes(simpleName) || simpleName.includes(simpleDomain.split('.')[0])) {
        return `https://${domain}`
      }
    }
  } catch (error) {
    // URL parsing failed, continue to content extraction
  }
  
  // Extract website from content
  const websitePatterns = [
    /website[:\s]+([a-zA-Z0-9][a-zA-Z0-9\-]{1,61}[a-zA-Z0-9]\.(?:com|io|ai|co|net|org))/i,
    /visit[:\s]+([a-zA-Z0-9][a-zA-Z0-9\-]{1,61}[a-zA-Z0-9]\.(?:com|io|ai|co|net|org))/i,
    /(https?:\/\/[a-zA-Z0-9][a-zA-Z0-9\-]{1,61}[a-zA-Z0-9]\.(?:com|io|ai|co|net|org))/i
  ]
  
  for (const pattern of websitePatterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      return match[1].startsWith('http') ? match[1] : `https://${match[1]}`
    }
  }
  
  return undefined
}

function determineCompanyStage(content: string, valuation?: string, fundingAmount?: string): string | undefined {
  const stageLower = content.toLowerCase()
  
  if (stageLower.includes('ipo') || stageLower.includes('public company')) {
    return 'Public'
  }
  
  if (valuation) {
    if (valuation.includes('B') || stageLower.includes('unicorn')) {
      return 'Unicorn'
    }
    if (valuation.includes('M')) {
      const value = parseFloat(valuation.replace(/[$M]/g, ''))
      if (value >= 100) return 'Late Stage'
      if (value >= 10) return 'Growth Stage'
    }
  }
  
  if (stageLower.includes('series d') || stageLower.includes('series e')) {
    return 'Late Stage'
  }
  if (stageLower.includes('series c')) {
    return 'Growth Stage'
  }
  if (stageLower.includes('series b')) {
    return 'Expansion'
  }
  if (stageLower.includes('series a')) {
    return 'Early Stage'
  }
  if (stageLower.includes('seed')) {
    return 'Seed'
  }
  
  return 'Private'
}

function generateCompanyDescription(snippet: string, companyName: string, industry: string): string {
  if (!snippet) {
    return `${industry} company`
  }
  
  // Clean up the snippet to create a concise description
  let description = snippet.substring(0, 150)
  
  // Remove company name repetition
  description = description.replace(new RegExp(companyName, 'gi'), 'the company')
  
  // Ensure it ends properly
  if (description.length === 150) {
    description = description.substring(0, description.lastIndexOf(' ')) + '...'
  }
  
  return description
}

function determineCompetitorRisk(content: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const contentLower = content.toLowerCase()
  
  // Critical threat indicators
  if (contentLower.includes('unicorn') || 
      contentLower.includes('billion') || 
      contentLower.includes('market leader') ||
      contentLower.includes('dominant') ||
      contentLower.includes('ipo')) {
    return 'CRITICAL'
  }
  
  // High threat indicators
  if (contentLower.includes('series c') || 
      contentLower.includes('series d') ||
      contentLower.includes('100m') || 
      contentLower.includes('acquisition') ||
      contentLower.includes('partnership with')) {
    return 'HIGH'
  }
  
  // Medium threat indicators
  if (contentLower.includes('series b') || 
      contentLower.includes('funding') || 
      contentLower.includes('raises') ||
      contentLower.includes('expansion') ||
      contentLower.includes('grows')) {
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