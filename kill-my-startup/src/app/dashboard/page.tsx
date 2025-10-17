"use client"

export default function DashboardPage() {
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
            <div className="text-xs text-white/60">Related to submitted ideas</div>
          </div>
          <div className="mt-4 space-y-4 max-h-64 overflow-y-auto">
            {[
              {
                title: "AI-powered fitness app raises $15M Series A",
                source: "TechCrunch",
                time: "2h ago",
                relevance: "Matches 3 recent submissions",
                url: "#",
                tag: "Fitness Tech"
              },
              {
                title: "Sustainable packaging startup Closed $8M funding round",
                source: "VentureBeat",
                time: "4h ago",
                relevance: "Similar to EcoWrap submission",
                url: "#",
                tag: "Sustainability"
              },
              {
                title: "Food delivery market shows 40% growth despite saturation",
                source: "Bloomberg",
                time: "6h ago",
                relevance: "Relevant to 7 food delivery ideas",
                url: "#",
                tag: "Food Delivery"
              },
              {
                title: "Remote work tools see declining user engagement",
                source: "The Information",
                time: "8h ago",
                relevance: "Warning for WorkSpace Pro submission",
                url: "#",
                tag: "Remote Work"
              },
              {
                title: "Crypto wallet security breaches increase 200%",
                source: "CoinDesk",
                time: "12h ago",
                relevance: "Critical for CryptoSafe idea",
                url: "#",
                tag: "Crypto"
              },
              {
                title: "B2B SaaS market consolidation accelerates",
                source: "Forbes",
                time: "1d ago",
                relevance: "Affects 12 SaaS submissions",
                url: "#",
                tag: "SaaS"
              }
            ].map((article, index) => (
              <div key={index} className="border-l-2 border-blue-500/30 pl-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-white/90 leading-tight">{article.title}</h3>
                  <span className="text-xs text-white/60 whitespace-nowrap">{article.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/70">{article.source}</span>
                  <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">{article.tag}</span>
                </div>
                <div className="text-xs text-yellow-400">{article.relevance}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium">Top Competitors</h2>
          <div className="mt-4 space-y-3">
            {[
              { name: "YC Startup School", news: "Launches AI mentor program" },
              { name: "AngelList", news: "Raises $100M Series D" },
              { name: "Product Hunt", news: "New discovery algorithm" },
              { name: "Indie Hackers", news: "Acquired by Stripe" },
              { name: "StartupGrind", news: "Expands to 50 cities" }
            ].map((competitor) => (
              <div key={competitor.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80 font-medium">{competitor.name}</span>
                  <div className="h-1 w-16 rounded bg-red-500/50" />
                </div>
                <div className="text-xs text-white/50">{competitor.news}</div>
              </div>
            ))}
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

