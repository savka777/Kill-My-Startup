import { NextRequest, NextResponse } from 'next/server'
import Perplexity from '@perplexity-ai/perplexity_ai'
import { CompetitorCache, type CompetitorData } from '@/lib/competitor-cache'
import { CompetitorScheduler } from '@/lib/competitor-scheduler'
import { prisma } from '@/lib/prisma'

export interface CompetitorSearchRequest {
  industry: string
  context?: string
  userInfo?: string
  max_results?: number
  forceRefresh?: boolean
  updateType?: 'discovery' | 'parameters' // New field to specify update type
}

export async function POST(request: NextRequest) {
  try {
    const body: CompetitorSearchRequest = await request.json()
    const { industry, context, userInfo, max_results = 8, forceRefresh = false, updateType = 'discovery' } = body

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

    // Auto-determine update type based on schedule if not specified
    const finalUpdateType = updateType === 'discovery' || updateType === 'parameters' 
      ? updateType 
      : await CompetitorScheduler.getUpdateType(industry)

    // Choose model and strategy based on update type
    let competitors: any[] = []
    
    if (finalUpdateType === 'discovery') {
      // Use sonar-pro for comprehensive competitor discovery (daily)
      console.log(`Running comprehensive discovery for ${industry}`)
      competitors = await performCompetitorDiscovery(client, industry, context, userInfo, max_results)
    } else {
      // Use sonar for frequent parameter updates (every 2 hours)
      console.log(`Running parameter updates for ${industry}`)
      competitors = await updateCompetitorParameters(client, industry, context, userInfo, max_results)
    }
    
    // Store in database and cache for future requests
    if (competitors.length > 0) {
      try {
        // Save to database first
        await saveCompetitorsToDatabase(competitors, industry)
        
        // Then cache for performance
        const ttlHours = finalUpdateType === 'discovery' ? 24 : 2 // 24h for discovery, 2h for parameters
        await CompetitorCache.storeCompetitors({
          industry,
          context,
          userInfo,
          ttlHours
        }, competitors)
        console.log(`Saved and cached ${competitors.length} competitors for ${finalUpdateType} (TTL: ${ttlHours}h)`)
      } catch (error) {
        console.error('Failed to save/cache competitors:', error)
        // Don't fail the request if saving fails
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
      fromCache: false,
      updateType: finalUpdateType,
      nextScheduledRun: finalUpdateType === 'discovery' 
        ? await CompetitorScheduler.getNextDiscoveryTime(industry)
        : await CompetitorScheduler.getNextParameterUpdateTime(industry)
    })

  } catch (error) {
    console.error('Competitor search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Comprehensive competitor discovery using sonar-pro (daily/hourly)
async function performCompetitorDiscovery(
  client: any, 
  industry: string, 
  context?: string, 
  userInfo?: string, 
  max_results: number = 12
): Promise<any[]> {
  const searchPrompt = `You are a competitive intelligence expert. Find ALL companies building similar products or services in the ${industry} industry.

Context: ${context || 'General market research'}
User Info: ${userInfo || 'Not provided'}

IMPORTANT: Look for ANY company building similar products, regardless of stage (startup, growth, established, public). Include:
- Direct competitors (same product/service)
- Indirect competitors (alternative solutions)
- Emerging competitors (new entrants)
- Adjacent competitors (related products)

Return ONLY a valid JSON array with this exact structure:

[
  {
    "name": "Company Name",
    "description": "Brief description of what they do and how they compete",
    "website": "https://company.com",
    "industry": "${industry}",
    "foundedYear": 2020,
    "employeeCount": "10-50",
    "lastFunding": "Series A",
    "fundingAmount": "$5M",
    "recentNews": "Recent funding, product launch, or significant news",
    "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL"
  }
]

Risk Level Guidelines:
- CRITICAL: Market leaders, unicorns, direct threats with significant resources
- HIGH: Well-funded competitors, established players, strong market presence
- MEDIUM: Growing companies, recent funding, moderate threat
- LOW: Early stage, limited resources, indirect competition

Find ${max_results} diverse competitors across all stages and types.`

  console.log('Performing comprehensive competitor discovery with sonar-pro')

  const search = await client.chat.completions.create({
    model: 'sonar-pro',
    messages: [
      {
        role: 'system',
        content: 'You are a competitive intelligence expert. Always return valid JSON arrays with accurate competitor data. Focus on finding companies building similar products regardless of their stage.'
      },
      {
        role: 'user',
        content: searchPrompt
      }
    ],
    temperature: 0.1,
    max_tokens: 4000,
    top_p: 0.9
  })

  const messageContent = search.choices[0].message.content
  const contentString = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent)
  return await parseCompetitorJSON(contentString || '[]', industry)
}

// Frequent parameter updates using sonar (more frequent, cost-effective)
async function updateCompetitorParameters(
  client: any, 
  industry: string, 
  context?: string, 
  userInfo?: string, 
  max_results: number = 8
): Promise<any[]> {
  const updatePrompt = `Update competitor information for the ${industry} industry. Focus on recent changes in:
- Funding rounds and amounts
- Employee count changes
- Recent news and developments
- Risk level adjustments
- New product launches

Context: ${context || 'Parameter update'}
User Info: ${userInfo || 'Not provided'}

Return ONLY a valid JSON array with updated competitor data:

[
  {
    "name": "Company Name",
    "description": "Updated description",
    "website": "https://company.com",
    "industry": "${industry}",
    "foundedYear": 2020,
    "employeeCount": "Updated count",
    "lastFunding": "Latest funding round",
    "fundingAmount": "Latest amount",
    "recentNews": "Most recent news",
    "riskLevel": "Updated risk level"
  }
]

Focus on ${max_results} key competitors with recent updates.`

  console.log('Updating competitor parameters with sonar')

  const search = await client.chat.completions.create({
    model: 'sonar',
    messages: [
      {
        role: 'system',
        content: 'You are a competitive intelligence expert. Return valid JSON arrays with updated competitor parameters. Focus on recent changes and developments.'
      },
      {
        role: 'user',
        content: updatePrompt
      }
    ],
    temperature: 0.1,
    max_tokens: 2000, // Smaller for parameter updates
    top_p: 0.9
  })

  const messageContent = search.choices[0].message.content
  const contentString = typeof messageContent === 'string' ? messageContent : JSON.stringify(messageContent)
  return await parseCompetitorJSON(contentString || '[]', industry)
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

async function parseCompetitorJSON(
  jsonResponse: string, 
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
  try {
    // Clean the JSON response - remove any markdown formatting or extra text
    let cleanJson = jsonResponse.trim()
    
    // Remove markdown code blocks if present
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    // Find the JSON array in the response
    const jsonStart = cleanJson.indexOf('[')
    const jsonEnd = cleanJson.lastIndexOf(']') + 1
    
    if (jsonStart === -1 || jsonEnd === 0) {
      console.error('No JSON array found in response:', cleanJson)
      return []
    }
    
    const jsonArray = cleanJson.substring(jsonStart, jsonEnd)
    const competitors = JSON.parse(jsonArray)
    
    // Validate and clean the competitor data
    const validCompetitors = competitors
      .filter((comp: any) => comp && comp.name && typeof comp.name === 'string')
      .map((comp: any) => ({
        name: comp.name.trim(),
        description: comp.description?.trim() || undefined,
        website: comp.website?.trim() || undefined,
        industry: comp.industry || industry,
        foundedYear: typeof comp.foundedYear === 'number' ? comp.foundedYear : undefined,
        employeeCount: comp.employeeCount?.trim() || undefined,
        lastFunding: comp.lastFunding?.trim() || undefined,
        fundingAmount: comp.fundingAmount?.trim() || undefined,
        recentNews: comp.recentNews?.trim() || undefined,
        riskLevel: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(comp.riskLevel) 
          ? comp.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          : 'MEDIUM'
      }))
      .slice(0, 12) // Limit to top 12 competitors
    
    console.log(`Successfully parsed ${validCompetitors.length} competitors from JSON`)
    return validCompetitors
    
  } catch (error) {
    console.error('Error parsing competitor JSON:', error)
    console.error('Raw response:', jsonResponse)
    return []
  }
}

// Save competitors to database
async function saveCompetitorsToDatabase(
  competitors: Array<{
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
  }>,
  industry: string
): Promise<void> {
  try {
    console.log(`Saving ${competitors.length} competitors to database for industry: ${industry}`)
    
    for (const competitor of competitors) {
      // Check if competitor already exists
      const existing = await prisma.competitorProfile.findUnique({
        where: { name: competitor.name }
      })
      
      if (existing) {
        // Update existing competitor with new data
        await prisma.competitorProfile.update({
          where: { name: competitor.name },
          data: {
            description: competitor.description || existing.description,
            website: competitor.website || existing.website,
            industry: competitor.industry,
            foundedYear: competitor.foundedYear || existing.foundedYear,
            employeeCount: competitor.employeeCount || existing.employeeCount,
            lastFunding: competitor.lastFunding || existing.lastFunding,
            fundingAmount: competitor.fundingAmount || existing.fundingAmount,
            recentNews: competitor.recentNews || existing.recentNews,
            riskLevel: competitor.riskLevel,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days TTL
          }
        })
        console.log(`Updated existing competitor: ${competitor.name}`)
      } else {
        // Create new competitor
        await prisma.competitorProfile.create({
          data: {
            name: competitor.name,
            description: competitor.description,
            website: competitor.website,
            industry: competitor.industry,
            foundedYear: competitor.foundedYear,
            employeeCount: competitor.employeeCount,
            lastFunding: competitor.lastFunding,
            fundingAmount: competitor.fundingAmount,
            recentNews: competitor.recentNews,
            riskLevel: competitor.riskLevel,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days TTL
          }
        })
        console.log(`Created new competitor: ${competitor.name}`)
      }
    }
    
    console.log(`Successfully saved ${competitors.length} competitors to database`)
  } catch (error) {
    console.error('Error saving competitors to database:', error)
    throw error
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