"use client"

import { useEffect, useState } from 'react'
import { getDashboardNews, type NewsItem } from '@/lib/perplexity'
import { getDashboardCompetitors, getRiskLevelColor, getRiskLevelTextColor, type CompetitorData } from '@/lib/competitors'
import PeopleTalkingAbout from '@/components/social-media/PeopleTalkingAbout'

export default function DashboardClient({ user }: { user: any }) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [competitors, setCompetitors] = useState<CompetitorData[]>([])
  const [loading, setLoading] = useState(true)
  const [competitorLoading, setCompetitorLoading] = useState(true)
  const [fromCache, setFromCache] = useState(false)
  const [competitorFromCache, setCompetitorFromCache] = useState(false)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [competitorLastFetch, setCompetitorLastFetch] = useState<Date | null>(null)

  useEffect(() => {
    async function fetchData() {
      // Use user's industry if available, otherwise default
      const industry = user.profile?.industry || 'AI/education'
      
      // Fetch news and competitors in parallel
      const [newsResult, competitorResult] = await Promise.allSettled([
        getDashboardNews(industry, user.profile?.targetMarket),
        getDashboardCompetitors(industry, user.profile?.startupDescription)
      ])
      
      // Handle news results
      if (newsResult.status === 'fulfilled' && newsResult.value.success && newsResult.value.news) {
        setNews(newsResult.value.news)
        setFromCache(newsResult.value.fromCache || false)
        setLastFetch(newsResult.value.lastFetch ? new Date(newsResult.value.lastFetch) : null)
      } else {
        console.error('Failed to fetch news:', newsResult.status === 'rejected' ? newsResult.reason : 'Unknown error')
      }
      setLoading(false)
      
      // Handle competitor results
      if (competitorResult.status === 'fulfilled' && competitorResult.value.success && competitorResult.value.competitors) {
        setCompetitors(competitorResult.value.competitors)
        setCompetitorFromCache(competitorResult.value.fromCache || false)
        setCompetitorLastFetch(competitorResult.value.lastFetch ? new Date(competitorResult.value.lastFetch) : null)
      } else {
        console.error('Failed to fetch competitors:', competitorResult.status === 'rejected' ? competitorResult.reason : 'Unknown error')
      }
      setCompetitorLoading(false)
    }
    
    fetchData()
  }, [user])

  return (
    <div className="py-2 w-full">
      {/* Header */}
      <header className="flex items-center justify-between pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Welcome back, {user.firstName || 'there'}! 
          </h1>
          <p className="text-white/60 text-sm md:text-base mt-1">
            {user.profile?.startupName} - {user.profile?.industry} intelligence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full bg-white text-black px-4 py-1.5 text-sm font-medium hover:bg-white/90 transition-colors">Export</button>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "News Articles", value: news.length.toString() },
          { label: "Competitors Tracked", value: competitors.length.toString() },
          { label: "Target Market", value: user.profile?.targetMarket ? "Set" : "Not Set" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-white/60">{k.label}</div>
            <div className="mt-2 text-2xl font-semibold">{k.value}</div>
            <div className="mt-4 h-10 rounded-md bg-white/10" />
          </div>
        ))}
      </section>

      {/* Charts grid */}
      <section id="analytics" className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">News</h2>
            <div className="flex items-center gap-2">
              {fromCache && (
                <span className="text-xs text-green-400">Cached</span>
              )}
              {lastFetch && (
                <span className="text-xs text-white/60">
                  Last updated: {lastFetch.toLocaleTimeString()}
                </span>
              )}
              <div className="text-xs text-white/60">{user.profile?.industry} space</div>
            </div>
          </div>
          <div className="mt-4 space-y-3 min-h-[200px] max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-white/60">Loading latest news...</div>
              </div>
            ) : news.length > 0 ? (
              news.map((article, index) => (
                <div key={index} className="border-l-2 border-blue-500/30 pl-3 space-y-1 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white/90 leading-tight hover:text-blue-400 transition-colors"
                    >
                      {article.title}
                    </a>
                    <span className="text-xs text-white/60 whitespace-nowrap">{article.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/70">Live Search</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      article.tag === 'Funding' ? 'bg-green-500/20 text-green-300' :
                      article.tag === 'AI Tech' ? 'bg-blue-500/20 text-blue-300' :
                      article.tag === 'Risk Alert' ? 'bg-red-500/20 text-red-300' :
                      'bg-purple-500/20 text-purple-300'
                    }`}>
                      {article.tag}
                    </span>
                  </div>
                  <div className="text-xs text-yellow-400">{article.relevance}</div>
                  {article.snippet && (
                    <div className="text-xs text-white/50 line-clamp-2">{article.snippet}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/60">
                No recent news found. Check back later.
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium">Top Competitors</h2>
            <div className="flex items-center gap-2">
              {competitorFromCache && (
                <span className="text-xs text-green-400">Cached</span>
              )}
              {competitorLastFetch && (
                <span className="text-xs text-white/60">
                  {competitorLastFetch.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-3 min-h-[200px] max-h-80 overflow-y-auto">
            {competitorLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-white/60">Analyzing competitors...</div>
              </div>
            ) : competitors.length > 0 ? (
              competitors.map((competitor) => (
                <div key={competitor.id} className="space-y-2 border-b border-white/5 pb-3 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/80 font-medium">{competitor.name}</span>
                      <div className={`h-1.5 w-1.5 rounded-full ${getRiskLevelColor(competitor.riskLevel)}`} />
                    </div>
                    <span className={`text-xs font-medium ${getRiskLevelTextColor(competitor.riskLevel)}`}>
                      {competitor.riskLevel}
                    </span>
                  </div>
                  
                  {competitor.description && (
                    <div className="text-xs text-white/60 line-clamp-2">{competitor.description}</div>
                  )}
                  
                  {competitor.recentNews && (
                    <div className="text-xs text-white/50 line-clamp-1 italic">{competitor.recentNews}</div>
                  )}
                  
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    {competitor.lastFunding && (
                      <span className="bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded">{competitor.lastFunding}</span>
                    )}
                    {competitor.fundingAmount && (
                      <span className="text-green-400 font-medium">{competitor.fundingAmount}</span>
                    )}
                    {competitor.website && (
                      <a 
                        href={`https://${competitor.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-400 transition-colors truncate max-w-24"
                      >
                        {competitor.website}
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-white/60">
                No competitors found. Market might be wide open!
              </div>
            )}
          </div>
        </div>
      </section>


      {/* People Talking About */}
      <section id="people-talking" className="mt-6">
        <PeopleTalkingAbout 
          projectId="cmgvqp51q0000ihc3b4f0d3tv" 
          initialDays={7} 
        />
      </section>

      {/* User's Competitors Timeline */}
      <section id="settings" className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium">Your Tracked Competitors</h2>
          <div className="text-xs text-white/60">From your intake form</div>
        </div>
        <div className="space-y-4">
          {user.profile?.keyCompetitors?.map((competitorName: string, index: number) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
              <div className="w-32 flex-shrink-0">
                <span className="text-sm font-medium text-white/90">{competitorName}</span>
              </div>
              <div className="flex-1 text-xs text-white/60">
                Monitoring activity and updates...
              </div>
              <div className="text-xs text-green-400">Active</div>
            </div>
          )) || (
            <div className="text-center py-8 text-white/60">
              No competitors specified in your profile.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}