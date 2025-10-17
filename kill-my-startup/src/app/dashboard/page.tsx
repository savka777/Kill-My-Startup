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
          { label: "Active Users", value: "12,480" },
          { label: "Conversion", value: "3.6%" },
          { label: "MRR", value: "$42.3k" },
          { label: "Churn", value: "1.2%" },
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
            <h2 className="text-base font-medium">Traffic</h2>
            <div className="text-xs text-white/60">Last 30 days</div>
          </div>
          <div className="mt-4 h-64 rounded-md bg-white/10" />
        </div>
        <div className="lg:col-span-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium">Top Sources</h2>
          <div className="mt-4 space-y-3">
            {["Direct", "Organic", "Referral", "Social", "Email"].map((s) => (
              <div key={s} className="flex items-center justify-between">
                <span className="text-sm text-white/80">{s}</span>
                <div className="h-2 w-1/2 rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two-up grid */}
      <section id="reports" className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium">Cohorts</h2>
          <div className="mt-4 h-64 rounded-md bg-white/10" />
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="text-base font-medium">Funnel</h2>
          <div className="mt-4 h-64 rounded-md bg-white/10" />
        </div>
      </section>

      {/* Settings placeholder */}
      <section id="settings" className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium">Settings</h2>
        <div className="mt-4 h-32 rounded-md bg-white/10" />
      </section>
    </div>
  )
}

