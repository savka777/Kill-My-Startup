export interface SearchOptions {
  userInfo?: string
  context?: string
  industry?: string
  max_results?: number
}

export interface NewsItem {
  title: string
  url: string
  date: string
  snippet?: string
  relevance: string
  tag: string
}

export interface SearchResult {
  success: boolean
  news?: NewsItem[]
  analysis?: string
  total_results?: number
  query?: string
  error?: string
  details?: string
}

export async function searchStartupNews(options: SearchOptions): Promise<SearchResult> {
  try {
    const response = await fetch('/api/search', {
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
        error: data.error || 'Search failed',
        details: data.details
      }
    }

    return data
  } catch (error) {
    return {
      success: false,
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Preset searches for common startup analysis
export const presetSearches = {
  generalNews: (industry: string) => ({
    industry,
    max_results: 10
  }),
  
  competitorAnalysis: (context: string, industry: string) => ({
    context,
    industry,
    max_results: 15
  }),
  
  fundingTrends: (industry: string) => ({
    industry,
    userInfo: 'funding trends analysis',
    max_results: 12
  }),
  
  riskAssessment: (context: string, industry: string) => ({
    context,
    industry,
    userInfo: 'risk and failure analysis',
    max_results: 10
  })
}

// Helper function for startup news analysis
export async function getStartupNewsAnalysis(
  startupIdea: string, 
  industry: string = 'AI/education'
) {
  return await searchStartupNews({
    context: startupIdea,
    industry,
    userInfo: `Analyzing startup idea: ${startupIdea}`,
    max_results: 15
  })
}

// Helper to get news for dashboard
export async function getDashboardNews(industry: string = 'AI/education') {
  return await searchStartupNews({
    industry,
    userInfo: 'dashboard news feed',
    max_results: 6
  })
}