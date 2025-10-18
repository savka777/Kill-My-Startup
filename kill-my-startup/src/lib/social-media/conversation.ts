import { ConversationSource, Sentiment } from '@prisma/client'

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
  const rapidApiHost = process.env.RAPIDAPI_TWITTER_HOST || 'twitter-api-v2.p.rapidapi.com'
  
  if (!rapidApiKey) {
    console.warn('RAPIDAPI_KEY not found, skipping Twitter mentions')
    return []
  }

  try {
    const response = await fetch(`https://${rapidApiHost}/search`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': rapidApiHost
      }
    })

    if (!response.ok) {
      throw new Error(`Twitter API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform Twitter API response to our format
    return data.tweets?.map((tweet: any) => ({
      url: `https://twitter.com/user/status/${tweet.id}`,
      text: tweet.text,
      publishedAt: tweet.created_at,
      source: ConversationSource.TWITTER,
      snippet: tweet.text
    })) || []
  } catch (error) {
    console.error('Error fetching Twitter mentions:', error)
    return []
  }
}

export async function fetchRedditMentions(keyword: string, since?: string): Promise<ConversationHit[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY
  const rapidApiHost = process.env.RAPIDAPI_REDDIT_HOST || 'reddit-data1.p.rapidapi.com'
  
  if (!rapidApiKey) {
    console.warn('RAPIDAPI_KEY not found, skipping Reddit mentions')
    return []
  }

  try {
    const response = await fetch(`https://${rapidApiHost}/search`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': rapidApiHost
      }
    })

    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform Reddit API response to our format
    return data.posts?.map((post: any) => ({
      url: `https://reddit.com${post.permalink}`,
      text: post.selftext || post.title,
      publishedAt: new Date(post.created_utc * 1000).toISOString(),
      source: ConversationSource.REDDIT,
      snippet: post.selftext || post.title
    })) || []
  } catch (error) {
    console.error('Error fetching Reddit mentions:', error)
    return []
  }
}

export async function filterWithSonar(hits: ConversationHit[]): Promise<ConversationHit[]> {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY
  
  if (!perplexityApiKey) {
    console.warn('PERPLEXITY_API_KEY not found, skipping Sonar filtering')
    return hits
  }

  try {
    // Use Perplexity Sonar to filter and analyze the hits
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-medium-online',
        messages: [
          {
            role: 'system',
            content: 'You are a content filter. Analyze the following social media posts and return only those that are relevant to the given keyword. Return a JSON array of relevant posts with their URLs and text content.'
          },
          {
            role: 'user',
            content: `Filter these posts for relevance to the keyword. Return only relevant posts:\n\n${JSON.stringify(hits)}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const filteredContent = data.choices[0]?.message?.content
    
    if (!filteredContent) {
      return hits
    }

    // Parse the filtered results (this would need to be adapted based on actual Sonar response format)
    try {
      const filtered = JSON.parse(filteredContent)
      return Array.isArray(filtered) ? filtered : hits
    } catch {
      return hits
    }
  } catch (error) {
    console.error('Error filtering with Sonar:', error)
    return hits
  }
}

// Strategy 2: Hacker News & Product Hunt (Perplexity Search)
export async function searchSpecificSites(keyword: string, sites: string[]): Promise<ConversationHit[]> {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY
  
  if (!perplexityApiKey) {
    console.warn('PERPLEXITY_API_KEY not found, skipping site-specific search')
    return []
  }

  try {
    const siteQueries = sites.map(site => `site:${site} ${keyword}`).join(' OR ')
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-medium-online',
        messages: [
          {
            role: 'system',
            content: 'You are a search assistant. Find recent posts and discussions about the given keyword on the specified websites. Return a JSON array with url, text, publishedAt, and source fields.'
          },
          {
            role: 'user',
            content: `Search for: ${keyword}\nOn sites: ${sites.join(', ')}\n\nReturn recent posts and discussions.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const searchResults = data.choices[0]?.message?.content
    
    if (!searchResults) {
      return []
    }

    // Parse and transform results
    try {
      const results = JSON.parse(searchResults)
      return Array.isArray(results) ? results.map((result: any) => ({
        url: result.url,
        text: result.text,
        publishedAt: result.publishedAt || new Date().toISOString(),
        source: result.source === 'hackernews' ? ConversationSource.HACKER_NEWS : ConversationSource.PRODUCT_HUNT,
        snippet: result.text
      })) : []
    } catch {
      return []
    }
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
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-medium-online',
        messages: [
          {
            role: 'system',
            content: 'You are a social media search assistant. Find recent discussions, posts, and mentions about the given keyword across various social media platforms, forums, and blogs. Exclude Twitter, Reddit, Hacker News, and Product Hunt as these are covered separately. Return a JSON array with url, text, publishedAt, and source fields.'
          },
          {
            role: 'user',
            content: `Search for social media discussions about: ${keyword}\n\nFind posts on forums, blogs, LinkedIn, and other social platforms. Exclude Twitter, Reddit, Hacker News, and Product Hunt.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const searchResults = data.choices[0]?.message?.content
    
    if (!searchResults) {
      return []
    }

    // Parse and transform results
    try {
      const results = JSON.parse(searchResults)
      return Array.isArray(results) ? results.map((result: any) => ({
        url: result.url,
        text: result.text,
        publishedAt: result.publishedAt || new Date().toISOString(),
        source: result.source === 'forum' ? ConversationSource.FORUM : 
                result.source === 'blog' ? ConversationSource.BLOG : ConversationSource.OTHER,
        snippet: result.text
      })) : []
    } catch {
      return []
    }
  } catch (error) {
    console.error('Error searching general social media:', error)
    return []
  }
}

// Sentiment & Token Extraction
export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY
  
  if (!perplexityApiKey) {
    // Fallback to simple rule-based sentiment analysis
    return analyzeSentimentFallback(text)
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'sonar-medium-online',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze the sentiment of the given text and extract key tokens. Return a JSON object with sentiment (POSITIVE/NEGATIVE/NEUTRAL), score (-1 to 1), and tokens (array of important words).'
          },
          {
            role: 'user',
            content: `Analyze sentiment and extract tokens from: "${text}"`
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    const data = await response.json()
    const analysis = data.choices[0]?.message?.content
    
    if (!analysis) {
      return analyzeSentimentFallback(text)
    }

    try {
      const result = JSON.parse(analysis)
      return {
        sentiment: result.sentiment || Sentiment.NEUTRAL,
        score: result.score || 0,
        tokens: result.tokens || []
      }
    } catch {
      return analyzeSentimentFallback(text)
    }
  } catch (error) {
    console.error('Error analyzing sentiment with Perplexity:', error)
    return analyzeSentimentFallback(text)
  }
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
