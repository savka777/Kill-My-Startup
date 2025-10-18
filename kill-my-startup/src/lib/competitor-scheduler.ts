import { CompetitorCache } from './competitor-cache'

export interface SchedulerConfig {
  discoveryIntervalHours: number // How often to run comprehensive discovery
  parameterUpdateIntervalHours: number // How often to update parameters
  industries: string[] // Industries to monitor
}

export class CompetitorScheduler {
  private static readonly DEFAULT_CONFIG: SchedulerConfig = {
    discoveryIntervalHours: 24, // Daily comprehensive discovery
    parameterUpdateIntervalHours: 2, // Every 2 hours for parameter updates
    industries: ['AI/education', 'SaaS', 'Fintech', 'Healthcare', 'E-commerce']
  }

  /**
   * Check if it's time for competitor discovery (comprehensive search)
   */
  static async shouldRunDiscovery(industry: string): Promise<boolean> {
    try {
      const cacheEntry = await CompetitorCache.getCachedCompetitors({
        industry,
        ttlHours: this.DEFAULT_CONFIG.discoveryIntervalHours
      })

      // If no cache or cache is expired, it's time for discovery
      return !cacheEntry
    } catch (error) {
      console.error('Error checking discovery schedule:', error)
      return true // Default to running discovery if there's an error
    }
  }

  /**
   * Check if it's time for parameter updates (frequent updates)
   */
  static async shouldUpdateParameters(industry: string): Promise<boolean> {
    try {
      const cacheEntry = await CompetitorCache.getCachedCompetitors({
        industry,
        ttlHours: this.DEFAULT_CONFIG.parameterUpdateIntervalHours
      })

      // If no cache or cache is expired, it's time for parameter updates
      return !cacheEntry
    } catch (error) {
      console.error('Error checking parameter update schedule:', error)
      return true // Default to running updates if there's an error
    }
  }

  /**
   * Get the appropriate update type based on schedule
   */
  static async getUpdateType(industry: string): Promise<'discovery' | 'parameters'> {
    const needsDiscovery = await this.shouldRunDiscovery(industry)
    
    if (needsDiscovery) {
      return 'discovery'
    }
    
    const needsParameterUpdate = await this.shouldUpdateParameters(industry)
    if (needsParameterUpdate) {
      return 'parameters'
    }
    
    // Default to parameters if neither is needed (shouldn't happen due to cache check)
    return 'parameters'
  }

  /**
   * Get next scheduled run time for discovery
   */
  static async getNextDiscoveryTime(industry: string): Promise<Date> {
    try {
      const cacheEntry = await CompetitorCache.getCachedCompetitors({
        industry,
        ttlHours: this.DEFAULT_CONFIG.discoveryIntervalHours
      })

      if (cacheEntry && cacheEntry.lastFetch) {
        const nextRun = new Date(cacheEntry.lastFetch)
        nextRun.setHours(nextRun.getHours() + this.DEFAULT_CONFIG.discoveryIntervalHours)
        return nextRun
      }

      // If no cache, run immediately
      return new Date()
    } catch (error) {
      console.error('Error getting next discovery time:', error)
      return new Date()
    }
  }

  /**
   * Get next scheduled run time for parameter updates
   */
  static async getNextParameterUpdateTime(industry: string): Promise<Date> {
    try {
      const cacheEntry = await CompetitorCache.getCachedCompetitors({
        industry,
        ttlHours: this.DEFAULT_CONFIG.parameterUpdateIntervalHours
      })

      if (cacheEntry && cacheEntry.lastFetch) {
        const nextRun = new Date(cacheEntry.lastFetch)
        nextRun.setHours(nextRun.getHours() + this.DEFAULT_CONFIG.parameterUpdateIntervalHours)
        return nextRun
      }

      // If no cache, run immediately
      return new Date()
    } catch (error) {
      console.error('Error getting next parameter update time:', error)
      return new Date()
    }
  }

  /**
   * Get scheduling status for all industries
   */
  static async getSchedulingStatus(): Promise<{
    industry: string
    nextDiscovery: Date
    nextParameterUpdate: Date
    needsDiscovery: boolean
    needsParameterUpdate: boolean
  }[]> {
    const statuses = await Promise.all(
      this.DEFAULT_CONFIG.industries.map(async (industry) => {
        const [nextDiscovery, nextParameterUpdate, needsDiscovery, needsParameterUpdate] = await Promise.all([
          this.getNextDiscoveryTime(industry),
          this.getNextParameterUpdateTime(industry),
          this.shouldRunDiscovery(industry),
          this.shouldUpdateParameters(industry)
        ])

        return {
          industry,
          nextDiscovery,
          nextParameterUpdate,
          needsDiscovery,
          needsParameterUpdate
        }
      })
    )

    return statuses
  }
}


