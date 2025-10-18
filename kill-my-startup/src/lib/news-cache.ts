import { prisma } from './prisma'
import crypto from 'crypto'

export interface CacheOptions {
  industry: string
  userInfo?: string
  context?: string
  ttlHours?: number // Time to live in hours, default 6 hours
}

export interface CachedNewsResult {
  fromCache: boolean
  articles: Array<{
    id: string
    title: string
    url: string
    date: string
    snippet?: string
    relevance: string
    tag: string
    industry: string
  }>
  totalResults: number
  lastFetch?: Date
}

export class NewsCache {
  private static readonly DEFAULT_TTL_HOURS = 6
  private static readonly CACHE_CLEANUP_HOURS = 24

  /**
   * Generate a cache key based on search parameters
   */
  static generateCacheKey(options: CacheOptions): string {
    const { industry, userInfo, context } = options
    const keyData = { industry, userInfo: userInfo || '', context: context || '' }
    return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex')
  }

  /**
   * Check if cached news exists and is still valid
   */
  static async getCachedNews(options: CacheOptions): Promise<CachedNewsResult | null> {
    const cacheKey = this.generateCacheKey(options)
    const now = new Date()

    try {
      // Check cache metadata
      const cacheEntry = await prisma.newsCache.findUnique({
        where: { cacheKey },
      })

      if (!cacheEntry || cacheEntry.expiresAt < now) {
        return null // Cache miss or expired
      }

      // Get cached articles
      const articles = await prisma.newsArticle.findMany({
        where: {
          industry: options.industry,
          expiresAt: { gt: now }
        },
        orderBy: { createdAt: 'desc' }
      })

      if (articles.length === 0) {
        return null // No valid articles in cache
      }

      return {
        fromCache: true,
        articles: articles.map(article => ({
          id: article.id,
          title: article.title,
          url: article.url,
          date: article.date,
          snippet: article.snippet || undefined,
          relevance: article.relevance,
          tag: article.tag,
          industry: article.industry
        })),
        totalResults: cacheEntry.totalResults,
        lastFetch: cacheEntry.lastFetch
      }

    } catch (error) {
      console.error('Error reading from news cache:', error)
      return null
    }
  }

  /**
   * Store news articles in cache
   */
  static async storeNews(
    options: CacheOptions, 
    articles: Array<{
      title: string
      url: string
      date: string
      snippet?: string
      relevance: string
      tag: string
    }>
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(options)
    const ttlHours = options.ttlHours || this.DEFAULT_TTL_HOURS
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000)

    try {
      // Use transaction to ensure consistency
      await prisma.$transaction(async (tx) => {
        // Update or create cache metadata
        await tx.newsCache.upsert({
          where: { cacheKey },
          update: {
            lastFetch: now,
            expiresAt,
            totalResults: articles.length
          },
          create: {
            cacheKey,
            lastFetch: now,
            expiresAt,
            totalResults: articles.length
          }
        })

        // Store articles (upsert to handle duplicates)
        for (const article of articles) {
          await tx.newsArticle.upsert({
            where: { url: article.url },
            update: {
              title: article.title,
              date: article.date,
              snippet: article.snippet,
              relevance: article.relevance,
              tag: article.tag,
              industry: options.industry,
              expiresAt,
              updatedAt: now
            },
            create: {
              title: article.title,
              url: article.url,
              date: article.date,
              snippet: article.snippet,
              relevance: article.relevance,
              tag: article.tag,
              industry: options.industry,
              expiresAt,
              createdAt: now,
              updatedAt: now
            }
          })
        }
      })

      console.log(`Cached ${articles.length} articles for industry: ${options.industry}`)

    } catch (error) {
      console.error('Error storing news cache:', error)
      throw error
    }
  }

  /**
   * Clean up expired cache entries
   */
  static async cleanupExpiredCache(): Promise<void> {
    const now = new Date()

    try {
      // Delete expired articles
      const deletedArticles = await prisma.newsArticle.deleteMany({
        where: { expiresAt: { lt: now } }
      })

      // Delete expired cache entries
      const deletedCache = await prisma.newsCache.deleteMany({
        where: { expiresAt: { lt: now } }
      })

      console.log(`Cleanup: Removed ${deletedArticles.count} articles and ${deletedCache.count} cache entries`)

    } catch (error) {
      console.error('Error during cache cleanup:', error)
    }
  }

  /**
   * Force refresh cache for a specific industry
   */
  static async invalidateCache(industry: string): Promise<void> {
    try {
      // Delete all cache entries for this industry
      await prisma.newsCache.deleteMany({
        where: {
          cacheKey: {
            contains: industry
          }
        }
      })

      // Delete all articles for this industry
      await prisma.newsArticle.deleteMany({
        where: { industry }
      })

      console.log(`Invalidated cache for industry: ${industry}`)

    } catch (error) {
      console.error('Error invalidating cache:', error)
      throw error
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<{
    totalArticles: number
    totalCacheEntries: number
    oldestArticle?: Date
    newestArticle?: Date
  }> {
    try {
      const [totalArticles, totalCacheEntries, oldestArticle, newestArticle] = await Promise.all([
        prisma.newsArticle.count(),
        prisma.newsCache.count(),
        prisma.newsArticle.findFirst({
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true }
        }),
        prisma.newsArticle.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        })
      ])

      return {
        totalArticles,
        totalCacheEntries,
        oldestArticle: oldestArticle?.createdAt,
        newestArticle: newestArticle?.createdAt
      }

    } catch (error) {
      console.error('Error getting cache stats:', error)
      return {
        totalArticles: 0,
        totalCacheEntries: 0
      }
    }
  }
}