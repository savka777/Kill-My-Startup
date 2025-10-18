'use client';

import { useEffect, useState } from 'react';

interface CompetitorRevenue {
  company: string;
  revenue: string | null;
  source: string | null;
  error?: string;
}

interface RevenueAPIResponse {
  success: boolean;
  data: CompetitorRevenue[];
  timestamp: string;
  error?: string;
}

export default function RevenueBlock() {
  const [data, setData] = useState<CompetitorRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRevenue() {
      try {
        setLoading(true);
        const response = await fetch('/api/revenue');
        const result: RevenueAPIResponse = await response.json();

        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || 'Failed to fetch revenue data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchRevenue();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium">Competitor Revenue</h2>
        <div className="mt-4 flex items-center justify-center py-8">
          <div className="animate-pulse text-sm text-white/60">Loading competitor revenue data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-base font-medium">Competitor Revenue</h2>
        <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-base font-medium">Competitor Revenue</h2>
      <div className="mt-4 space-y-3">
        {data.map((competitor) => (
          <div key={competitor.company} className="border-b border-white/5 pb-3 last:border-0">
            <div className="flex items-start justify-between mb-1">
              <span className="text-sm font-medium text-white/90">{competitor.company}</span>
              {competitor.source && (
                <a
                  href={competitor.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Source
                </a>
              )}
            </div>
            {competitor.error ? (
              <p className="text-xs text-red-400/80">{competitor.error}</p>
            ) : competitor.revenue ? (
              <p className="text-sm text-white/70 leading-relaxed">{competitor.revenue}</p>
            ) : (
              <p className="text-xs text-white/40 italic">Data not available</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
