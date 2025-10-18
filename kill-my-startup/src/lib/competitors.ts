export interface CompetitorSearchOptions {
  industry: string
  context?: string
  userInfo?: string
  max_results?: number
  forceRefresh?: boolean
}

export interface CompetitorData {
  id: string
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
}

export interface CompetitorSearchResult {
  success: boolean
  competitors?: CompetitorData[]
  total_competitors?: number
  fromCache?: boolean
  lastFetch?: Date
  error?: string
  details?: string
}

export async function searchCompetitors(options: CompetitorSearchOptions): Promise<CompetitorSearchResult> {
  try {
    const response = await fetch('/api/competitors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Competitor search failed',
        details: data.details
      }
    }

    return {
      success: true,
      competitors: data.competitors,
      total_competitors: data.total_competitors,
      fromCache: data.fromCache,
      lastFetch: data.lastFetch ? new Date(data.lastFetch) : undefined
    }
  } catch (error) {
    return {
      success: false,
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper to get competitors for dashboard
export async function getDashboardCompetitors(industry: string = 'AI/education') {
  return await searchCompetitors({
    industry,
    userInfo: 'dashboard competitor analysis',
    max_results: 5
  })
}

// Helper to get competitors for specific startup idea
export async function getCompetitorsForIdea(
  startupIdea: string, 
  industry: string = 'AI/education'
) {
  return await searchCompetitors({
    industry,
    context: startupIdea,
    userInfo: `Competitor analysis for: ${startupIdea}`,
    max_results: 8
  })
}

// Helper to force refresh competitor data
export async function refreshCompetitorData(industry: string) {
  return await searchCompetitors({
    industry,
    forceRefresh: true,
    max_results: 10
  })
}

// Helper to get risk level color
export function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'CRITICAL':
      return 'bg-red-500'
    case 'HIGH':
      return 'bg-orange-500'
    case 'MEDIUM':
      return 'bg-yellow-500'
    case 'LOW':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
}

// Helper to get risk level text color
export function getRiskLevelTextColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'CRITICAL':
      return 'text-red-300'
    case 'HIGH':
      return 'text-orange-300'
    case 'MEDIUM':
      return 'text-yellow-300'
    case 'LOW':
      return 'text-green-300'
    default:
      return 'text-gray-300'
  }
}