"use client"

import { useEffect, useState } from 'react'
import { getDashboardNews, type NewsItem } from '@/lib/perplexity'
import { getDashboardCompetitors, getRiskLevelColor, getRiskLevelTextColor, type CompetitorData } from '@/lib/competitors'

export default function DashboardPage() {
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
      // Fetch news and competitors in parallel
      const [newsResult, competitorResult] = await Promise.allSettled([
        getDashboardNews('AI/education'),
        getDashboardCompetitors('AI/education')
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
  }, [])
  return (
    <div className="py-2 w-full">
      {/* Header */}
      <header className="flex items-center justify-between pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-white/60 text-sm md:text-base mt-1">Grid-based analytics overview</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full bg-white text-black px-4 py-1.5 text-sm font-medium hover:bg-white/90 transition-colors">Export</button>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Submissions Today", value: "47" },
          { label: "Kill Rate", value: "73.2%" },
          { label: "Revenue", value: "$8.4k" },
          { label: "Avg Review Time", value: "4.2h" },
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
              <div className="text-xs text-white/60">AI/Education space</div>
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

      {/* Two-up grid */}
      <section id="reports" className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium">Revenue</h2>
          <div className="mt-4 space-y-3">
            {[
              { month: "Jan", mrr: "$2.1k", growth: "+12%" },
              { month: "Feb", mrr: "$3.4k", growth: "+62%" },
              { month: "Mar", mrr: "$5.2k", growth: "+53%" },
              { month: "Apr", mrr: "$6.8k", growth: "+31%" },
              { month: "May", mrr: "$8.4k", growth: "+24%" }
            ].map((data) => (
              <div key={data.month} className="flex items-center justify-between">
                <span className="text-sm text-white/80">{data.month}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{data.mrr}</span>
                  <span className="text-xs text-green-400">{data.growth}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium">Survival Rate</h2>
          <div className="mt-4 space-y-4">
            {[
              { stage: "Submitted", count: 2847, percentage: 100 },
              { stage: "Reviewed", count: 2134, percentage: 75 },
              { stage: "Killed", count: 2084, percentage: 73.2 },
              { stage: "Survived", count: 50, percentage: 1.8 },
              { stage: "Success Stories", count: 12, percentage: 0.4 }
            ].map((stage) => (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">{stage.stage}</span>
                  <span className="text-sm font-medium">{stage.count}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1">
                  <div 
                    className="bg-red-500 h-1 rounded-full" 
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitors Launched Timeline */}
      <section id="settings" className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium">Competitors Launched</h2>
          <div className="text-xs text-white/60">Sources: Product Hunt, TechCrunch, LinkedIn</div>
        </div>
        <div className="space-y-4">
          {[
            { 
              company: "StartupKiller AI",
              timeline: [
                { date: "Feb", event: "Founded", type: "launch" },
                { date: "Mar", event: "Seed $2M", type: "funding" },
                { date: "Apr", event: "Product Hunt", type: "launch" },
                { date: "May", event: "Series A $15M", type: "funding" }
              ]
            },
            { 
              company: "YC Startup School",
              timeline: [
                { date: "Jan", event: "AI Program", type: "feature" },
                { date: "Feb", event: "Mentor Network", type: "partnership" },
                { date: "Apr", event: "Series B $50M", type: "funding" },
                { date: "May", event: "Global Expansion", type: "feature" }
              ]
            },
            { 
              company: "AngelList",
              timeline: [
                { date: "Dec", event: "Rebrand", type: "feature" },
                { date: "Jan", event: "API Launch", type: "launch" },
                { date: "Apr", event: "OpenAI Deal", type: "partnership" },
                { date: "Jun", event: "Crypto Fund", type: "funding" }
              ]
            },
            { 
              company: "Product Hunt",
              timeline: [
                { date: "Jan", event: "Mobile App v2", type: "feature" },
                { date: "Mar", event: "AI Curation", type: "feature" },
                { date: "Apr", event: "Creator Fund", type: "funding" },
                { date: "May", event: "Launch Fest", type: "launch" }
              ]
            },
            { 
              company: "Indie Hackers",
              timeline: [
                { date: "Feb", event: "Community Growth", type: "feature" },
                { date: "Mar", event: "Stripe Acquisition", type: "acquisition" },
                { date: "Apr", event: "Platform Relaunch", type: "launch" },
                { date: "May", event: "Revenue Sharing", type: "feature" }
              ]
            }
          ].map((competitor, index) => (
            <div key={index} className="flex items-center gap-4">
              {/* Company name on left */}
              <div className="w-32 flex-shrink-0">
                <span className="text-sm font-medium text-white/90">{competitor.company}</span>
              </div>
              
              {/* Timeline graph on right */}
              <div className="flex-1 relative">
                {/* Timeline line */}
                <div className="absolute top-2 left-0 right-0 h-0.5 bg-white/10"></div>
                
                {/* Timeline events */}
                <div className="flex relative">
                  {competitor.timeline.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex-1 relative group">
                      {/* Timeline dot */}
                      <div className={`w-1 h-1 rounded-full mx-auto ${
                        item.type === 'launch' ? 'bg-blue-500' :
                        item.type === 'funding' ? 'bg-green-500' :
                        item.type === 'partnership' ? 'bg-purple-500' :
                        item.type === 'acquisition' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`} />
                      
                      {/* Hover tooltip */}
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/90 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                        <div className="font-medium">{item.event}</div>
                        <div className="text-white/60">{item.date} 2024</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

