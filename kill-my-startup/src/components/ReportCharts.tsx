"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface NewsData {
  name: string
  value: number
}

interface CompetitorData {
  name: string
  value: number
}

interface ReportChartsProps {
  newsData: NewsData[]
  competitorData: CompetitorData[]
}

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#ea580c']

export function ReportCharts({ newsData, competitorData }: ReportChartsProps) {
  return (
    <div className="space-y-8">
      {/* News Distribution Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">News Distribution</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={newsData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Bar dataKey="value" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Competitor Risk Levels */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Competitor Risk Levels</h3>
        <div className="h-64 flex">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={competitorData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {competitorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-32 flex flex-col justify-center space-y-2">
            {competitorData.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Component for generating chart images for PDF
export function generateChartDataForPDF(newsAnalysis: any, competitorAnalysis: any) {
  const newsData = [
    { name: 'Funding', value: newsAnalysis.funding },
    { name: 'Competitor News', value: newsAnalysis.competitorNews },
    { name: 'Market Analysis', value: newsAnalysis.marketAnalysis },
    { name: 'Risk Alerts', value: newsAnalysis.riskAlerts },
  ].filter(item => item.value > 0)

  const competitorData = [
    { name: 'Critical', value: competitorAnalysis.critical },
    { name: 'High', value: competitorAnalysis.high },
    { name: 'Medium', value: competitorAnalysis.medium },
    { name: 'Low', value: competitorAnalysis.low },
  ].filter(item => item.value > 0)

  return { newsData, competitorData }
}