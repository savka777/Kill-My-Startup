import { prisma } from './prisma'
import crypto from 'crypto'

export interface CompetitorCacheOptions {
  industry: string
  context?: string
  userInfo?: string
  ttlHours?: number // Time to live in hours, default 12 hours
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

export interface CachedCompetitorResult {
  fromCache: boolean
  competitors: CompetitorData[]
  totalCompetitors: number
  lastFetch?: Date
}

export class CompetitorCache {
  private static readonly DEFAULT_TTL_HOURS = 12
  private static readonly COMPETITOR_CLEANUP_HOURS = 48

  /**
   * Generate a cache key based on search parameters
   */
  static generateCacheKey(options: CompetitorCacheOptions): string {
    const { industry, context, userInfo } = options
    const keyData = { industry, context: context || '', userInfo: userInfo || '' }
    return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex')
  }

  /**
   * Check if cached competitor data exists and is still valid
   */
  static async getCachedCompetitors(options: CompetitorCacheOptions): Promise<CachedCompetitorResult | null> {
    const cacheKey = this.generateCacheKey(options)
    const now = new Date()

    try {
      // Check cache metadata
      const cacheEntry = await prisma.competitorCache.findUnique({
        where: { cacheKey },
      })

      if (!cacheEntry || cacheEntry.expiresAt < now) {
        return null // Cache miss or expired
      }

      // Get cached competitor profiles
      const competitors = await prisma.competitorProfile.findMany({
        where: {
          industry: options.industry,
          expiresAt: { gt: now }
        },
        orderBy: [
          { riskLevel: 'desc' }, // HIGH/CRITICAL risk first
          { updatedAt: 'desc' }
        ]
      })

      if (competitors.length === 0) {
        return null // No valid competitors in cache
      }

      return {
        fromCache: true,
        competitors: competitors.map(comp => ({
          id: comp.id,
          name: comp.name,
          description: comp.description || undefined,
          website: comp.website || undefined,
          industry: comp.industry,
          foundedYear: comp.foundedYear || undefined,
          employeeCount: comp.employeeCount || undefined,
          lastFunding: comp.lastFunding || undefined,
          fundingAmount: comp.fundingAmount || undefined,
          recentNews: comp.recentNews || undefined,
          riskLevel: comp.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
        })),
        totalCompetitors: cacheEntry.totalCompetitors,
        lastFetch: cacheEntry.lastFetch
      }

    } catch (error) {
      console.error('Error reading from competitor cache:', error)
      return null
    }
  }

  /**
   * Store competitor data in cache
   */
  static async storeCompetitors(
    options: CompetitorCacheOptions,
    competitors: Array<{
      name: string
      description?: string
      website?: string
      foundedYear?: number
      employeeCount?: string
      lastFunding?: string
      fundingAmount?: string
      recentNews?: string
      riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
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
        await tx.competitorCache.upsert({
          where: { cacheKey },
          update: {
            lastFetch: now,
            expiresAt,
            totalCompetitors: competitors.length,
            industry: options.industry
          },
          create: {
            cacheKey,
            industry: options.industry,
            lastFetch: now,
            expiresAt,
            totalCompetitors: competitors.length
          }
        })

        // Store competitor profiles (upsert to handle duplicates)
        for (const competitor of competitors) {
          await tx.competitorProfile.upsert({
            where: { name: competitor.name },
            update: {
              description: competitor.description,
              website: competitor.website,
              industry: options.industry,
              foundedYear: competitor.foundedYear,
              employeeCount: competitor.employeeCount,
              lastFunding: competitor.lastFunding,
              fundingAmount: competitor.fundingAmount,
              recentNews: competitor.recentNews,
              riskLevel: competitor.riskLevel || 'MEDIUM',
              expiresAt,
              updatedAt: now
            },
            create: {
              name: competitor.name,
              description: competitor.description,
              website: competitor.website,
              industry: options.industry,
              foundedYear: competitor.foundedYear,
              employeeCount: competitor.employeeCount,
              lastFunding: competitor.lastFunding,
              fundingAmount: competitor.fundingAmount,
              recentNews: competitor.recentNews,
              riskLevel: competitor.riskLevel || 'MEDIUM',
              expiresAt,
              createdAt: now,
              updatedAt: now
            }
          })
        }
      })

      console.log(`Cached ${competitors.length} competitors for industry: ${options.industry}`)

    } catch (error) {
      console.error('Error storing competitor cache:', error)
      throw error
    }
  }

  /**
   * Clean up expired competitor cache entries
   */
  static async cleanupExpiredCache(): Promise<void> {
    const now = new Date()

    try {
      // Delete expired competitor profiles
      const deletedProfiles = await prisma.competitorProfile.deleteMany({
        where: { expiresAt: { lt: now } }
      })

      // Delete expired cache entries
      const deletedCache = await prisma.competitorCache.deleteMany({
        where: { expiresAt: { lt: now } }
      })

      console.log(`Cleanup: Removed ${deletedProfiles.count} competitor profiles and ${deletedCache.count} cache entries`)

    } catch (error) {
      console.error('Error during competitor cache cleanup:', error)
    }
  }

  /**
   * Force refresh cache for a specific industry
   */
  static async invalidateCache(industry: string): Promise<void> {
    try {
      // Delete all cache entries for this industry
      await prisma.competitorCache.deleteMany({
        where: { industry }
      })

      // Delete all competitor profiles for this industry
      await prisma.competitorProfile.deleteMany({
        where: { industry }
      })

      console.log(`Invalidated competitor cache for industry: ${industry}`)

    } catch (error) {
      console.error('Error invalidating competitor cache:', error)
      throw error
    }
  }

  /**
   * Get competitor cache statistics
   */
  static async getCacheStats(): Promise<{
    totalCompetitors: number
    totalCacheEntries: number
    byIndustry: Record<string, number>
    byRiskLevel: Record<string, number>
  }> {
    try {
      const [totalCompetitors, totalCacheEntries, byIndustry, byRiskLevel] = await Promise.all([
        prisma.competitorProfile.count(),
        prisma.competitorCache.count(),
        prisma.competitorProfile.groupBy({
          by: ['industry'],
          _count: { industry: true }
        }),
        prisma.competitorProfile.groupBy({
          by: ['riskLevel'],
          _count: { riskLevel: true }
        })
      ])

      return {
        totalCompetitors,
        totalCacheEntries,
        byIndustry: Object.fromEntries(
          byIndustry.map(item => [item.industry, item._count.industry])
        ),
        byRiskLevel: Object.fromEntries(
          byRiskLevel.map(item => [item.riskLevel, item._count.riskLevel])
        )
      }

    } catch (error) {
      console.error('Error getting competitor cache stats:', error)
      return {
        totalCompetitors: 0,
        totalCacheEntries: 0,
        byIndustry: {},
        byRiskLevel: {}
      }
    }
  }

  /**
   * Get top competitors by risk level for an industry
   */
  static async getTopRiskyCompetitors(industry: string, limit: number = 5): Promise<CompetitorData[]> {
    try {
      const competitors = await prisma.competitorProfile.findMany({
        where: {
          industry,
          expiresAt: { gt: new Date() }
        },
        orderBy: [
          { riskLevel: 'desc' },
          { updatedAt: 'desc' }
        ],
        take: limit
      })

      return competitors.map(comp => ({
        id: comp.id,
        name: comp.name,
        description: comp.description || undefined,
        website: comp.website || undefined,
        industry: comp.industry,
        foundedYear: comp.foundedYear || undefined,
        employeeCount: comp.employeeCount || undefined,
        lastFunding: comp.lastFunding || undefined,
        fundingAmount: comp.fundingAmount || undefined,
        recentNews: comp.recentNews || undefined,
        riskLevel: comp.riskLevel as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
      }))

    } catch (error) {
      console.error('Error getting top risky competitors:', error)
      return []
    }
  }
}