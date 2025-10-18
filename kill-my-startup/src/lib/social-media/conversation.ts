import { ConversationSource, Sentiment } from '@prisma/client'
import Perplexity from '@perplexity-ai/perplexity_ai'

export interface ConversationHit {
  url: string
  text: string
  publishedAt: string
  source: ConversationSource
  snippet?: string
}

export interface SentimentResult {
  sentiment: Sentiment
  score: number
  tokens: string[]
}

// Strategy 1: Twitter & Reddit (RapidAPI + Perplexity Sonar)
export async function fetchTwitterMentions(keyword: string, since?: string): Promise<ConversationHit[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY
  const rapidApiHost = process.env.RAPIDAPI_TWITTER_HOST || 'real-time-x-com-data-scraper.p.rapidapi.com'
  
  if (!rapidApiKey) {
    console.warn('RAPIDAPI_KEY not found, skipping Twitter mentions')
    return []
  }

  try {
    // Build query parameters
    const params = new URLSearchParams({
      query: keyword,
      section: 'top',
      limit: '20'
    })
    
    if (since) {
      params.append('min_retweets', '0')
      params.append('min_faves', '0')
    }

    const response = await fetch(`https://${rapidApiHost}/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': rapidApiHost
      }
    })

    if (!response.ok) {
      console.warn(`Twitter API error: ${response.status}, skipping Twitter mentions`)
      return []
    }

    const data = await response.json()
    
    // Transform Twitter API response to our format
    const tweets = data.data?.tweets || data.tweets || []
    return tweets.map((tweet: any) => ({
      url: `https://twitter.com/user/status/${tweet.tweet_id || tweet.id}`,
      text: tweet.text || tweet.full_text || '',
      publishedAt: tweet.created_at || new Date().toISOString(),
      source: ConversationSource.TWITTER,
      snippet: tweet.text || tweet.full_text || ''
    })).filter((hit: ConversationHit) => hit.text.length > 0)
  } catch (error) {
    console.error('Error fetching Twitter mentions:', error)
    return []
  }
}

export async function fetchRedditMentions(keyword: string, since?: string): Promise<ConversationHit[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY
  const rapidApiHost = process.env.RAPIDAPI_REDDIT_HOST || 'reddit34.p.rapidapi.com'
  
  if (!rapidApiKey) {
    console.warn('RAPIDAPI_KEY not found, skipping Reddit mentions')
    return []
  }

  try {
    // Build query parameters for Reddit search
    const params = new URLSearchParams({
      query: keyword,
      sort: 'relevance',
      limit: '20'
    })

    const response = await fetch(`https://${rapidApiHost}/search?${params.toString()}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': rapidApiHost
      }
    })

    if (!response.ok) {
      console.warn(`Reddit API error: ${response.status}, skipping Reddit mentions`)
      return []
    }

    const data = await response.json()
    
    // Transform Reddit API response to our format
    const posts = data.data || data.posts || []
    return posts.map((post: any) => ({
      url: post.url || `https://reddit.com${post.permalink || ''}`,
      text: post.selftext || post.title || '',
      publishedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : new Date().toISOString(),
      source: ConversationSource.REDDIT,
      snippet: post.selftext || post.title || ''
    })).filter((hit: ConversationHit) => hit.text.length > 0)
  } catch (error) {
    console.error('Error fetching Reddit mentions:', error)
    return []
  }
}

export async function filterWithSonar(hits: ConversationHit[]): Promise<ConversationHit[]> {
  // For now, just return the hits as filtering is done by the other functions
  // We can implement more sophisticated filtering later if needed
  if (hits.length === 0) {
    return hits
  }
  
  // Simple relevance filtering based on text content
  return hits.filter(hit => {
    const text = hit.text.toLowerCase()
    // Filter out very short posts or obvious spam
    return text.length > 10 && 
           !text.includes('bot') && 
           !text.includes('spam') &&
           !text.includes('advertisement')
  })
}

// Strategy 2: Hacker News & Product Hunt (Perplexity Search)
export async function searchSpecificSites(keyword: string, sites: string[]): Promise<ConversationHit[]> {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY
  
  if (!perplexityApiKey) {
    console.warn('PERPLEXITY_API_KEY not found, skipping site-specific search')
    return []
  }

  try {
    // Use Perplexity SDK for site-specific queries
    const client = new Perplexity({
      apiKey: perplexityApiKey,
    })
    
    const siteQuery = sites.map(site => `site:${site} ${keyword}`).join(' OR ')
    
    const search = await client.search.create({
      query: siteQuery,
      max_results: 10,
      return_snippets: true,
      country: 'US'
    })

    const results = search.results || []
    
    return results.map((result: any) => ({
      url: result.url || '',
      text: result.snippet || result.title || '',
      publishedAt: result.date || new Date().toISOString(),
      source: result.url?.includes('news.ycombinator.com') ? ConversationSource.HACKER_NEWS : 
              result.url?.includes('producthunt.com') ? ConversationSource.PRODUCT_HUNT : 
              ConversationSource.OTHER,
      snippet: result.snippet || result.title || ''
    })).filter((hit: ConversationHit) => hit.text.length > 10)
  } catch (error) {
    console.error('Error searching specific sites:', error)
    return []
  }
}

// Strategy 3: General Social Media (Perplexity Search)
export async function searchGeneralSocial(keyword: string): Promise<ConversationHit[]> {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY
  
  if (!perplexityApiKey) {
    console.warn('PERPLEXITY_API_KEY not found, skipping general social search')
    return []
  }

  try {
    // Use Perplexity SDK for general social search
    const client = new Perplexity({
      apiKey: perplexityApiKey,
    })
    
    const query = `${keyword} discussions forums blogs -site:twitter.com -site:reddit.com -site:news.ycombinator.com -site:producthunt.com`
    
    const search = await client.search.create({
      query: query,
      max_results: 10,
      return_snippets: true,
      country: 'US'
    })

    const results = search.results || []
    
    return results.map((result: any) => ({
      url: result.url || '',
      text: result.snippet || result.title || '',
      publishedAt: result.date || new Date().toISOString(),
      source: result.url?.includes('forum') || result.url?.includes('community') ? ConversationSource.FORUM : 
              result.url?.includes('blog') || result.url?.includes('medium.com') ? ConversationSource.BLOG : 
              ConversationSource.OTHER,
      snippet: result.snippet || result.title || ''
    })).filter((hit: ConversationHit) => hit.text.length > 10)
  } catch (error) {
    console.error('Error searching general social media:', error)
    return []
  }
}

// Sentiment & Token Extraction
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  // Use simple rule-based sentiment analysis for now
  // This is faster and more reliable than API calls for sentiment analysis
  return analyzeSentimentFallback(text)
}

function analyzeSentimentFallback(text: string): SentimentResult {
  const positiveWords = ['love', 'amazing', 'great', 'excellent', 'fantastic', 'awesome', 'good', 'best', 'perfect', 'wonderful']
  const negativeWords = ['hate', 'terrible', 'awful', 'bad', 'worst', 'horrible', 'boring', 'expensive', 'useless', 'stupid']
  
  const words = text.toLowerCase().split(/\s+/)
  const positiveCount = words.filter(word => positiveWords.some(pw => word.includes(pw))).length
  const negativeCount = words.filter(word => negativeWords.some(nw => word.includes(nw))).length
  
  let sentiment: Sentiment = Sentiment.NEUTRAL
  let score = 0
  
  if (positiveCount > negativeCount) {
    sentiment = Sentiment.POSITIVE
    score = Math.min(1, positiveCount / 10)
  } else if (negativeCount > positiveCount) {
    sentiment = Sentiment.NEGATIVE
    score = Math.max(-1, -negativeCount / 10)
  }
  
  // Extract tokens (simple approach)
  const tokens = words
    .filter(word => word.length > 3)
    .filter(word => !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'new', 'because', 'any', 'these', 'give', 'day', 'may', 'use', 'her', 'much', 'than', 'call', 'its', 'now', 'find', 'long', 'down', 'did', 'get', 'has', 'had', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word))
    .slice(0, 10)
  
  return { sentiment, score, tokens }
}

export async function extractTokens(text: string): Promise<string[]> {
  const result = await analyzeSentiment(text)
  return result.tokens
}
