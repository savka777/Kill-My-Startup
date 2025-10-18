"use client"

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface SourceBreakdownProps {
  sourceBreakdown: Record<string, number>
  onSourceFilter?: (source: string | null) => void
  selectedSource?: string | null
}

// Vibrant brand color palette for different sources
const getSourceColor = (source: string): string => {
  const colors: Record<string, string> = {
    TWITTER: '#1DA1F2',      // Twitter Blue
    REDDIT: '#FF4500',       // Reddit Orange
    HACKER_NEWS: '#FF6600',  // Hacker News Orange
    PRODUCT_HUNT: '#DA552F', // Product Hunt Orange
    FORUM: '#8B5CF6',        // Purple
    BLOG: '#10B981',         // Green
    OTHER: '#6B7280'         // Gray
  }
  return colors[source] || '#6B7280'
}

// Source display names
const getSourceDisplayName = (source: string): string => {
  const names: Record<string, string> = {
    TWITTER: 'Twitter',
    REDDIT: 'Reddit',
    HACKER_NEWS: 'Hacker News',
    PRODUCT_HUNT: 'Product Hunt',
    FORUM: 'Forums',
    BLOG: 'Blogs',
    OTHER: 'Other'
  }
  return names[source] || source
}

// Custom tooltip for pie chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-black/90 text-white p-3 rounded-lg border border-white/20">
        <p className="text-sm font-medium">{getSourceDisplayName(data.name)}</p>
        <p className="text-xs text-white/80">
          {data.value} mentions ({data.percent}%)
        </p>
      </div>
    )
  }
  return null
}

// Custom legend
const CustomLegend = ({ payload, onSourceFilter, selectedSource }: any) => {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {payload.map((entry: any, index: number) => (
        <div
          key={index}
          className="flex items-center gap-2 text-xs cursor-pointer hover:opacity-80"
          onClick={() => onSourceFilter?.(entry.name === selectedSource ? null : entry.name)}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-white/80">{getSourceDisplayName(entry.name)}</span>
          <span className="text-white/60">({entry.value})</span>
        </div>
      ))}
    </div>
  )
}

export default function ConversationSourceBreakdown({
  sourceBreakdown,
  onSourceFilter,
  selectedSource
}: SourceBreakdownProps) {
  // Convert source breakdown to chart data
  const chartData = Object.entries(sourceBreakdown)
    .map(([source, count]) => ({
      name: source,
      value: count,
      color: getSourceColor(source)
    }))
    .sort((a, b) => b.value - a.value)

  const totalMentions = Object.values(sourceBreakdown).reduce((sum, count) => sum + count, 0)

  if (totalMentions === 0) {
    return (
      <div className="bg-white/5 rounded-lg border border-white/10 p-6">
        <h3 className="text-sm font-medium text-white mb-4">Source Breakdown</h3>
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="text-white/60 text-sm mb-2">No conversation data</div>
            <div className="text-white/40 text-xs">Sources will appear as data is collected</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">Source Breakdown</h3>
        <div className="text-xs text-white/60">{totalMentions} total mentions</div>
      </div>

      {/* Pie Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke={selectedSource === entry.name ? '#FFFFFF' : 'none'}
                  strokeWidth={selectedSource === entry.name ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <CustomLegend payload={chartData} onSourceFilter={onSourceFilter} selectedSource={selectedSource} />

      {/* Source list with percentages */}
      <div className="mt-4 space-y-2">
        {chartData.map((source, index) => {
          const percentage = ((source.value / totalMentions) * 100).toFixed(1)
          const isSelected = selectedSource === source.name
          
          return (
            <div
              key={index}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-white/10 border border-white/20' 
                  : 'hover:bg-white/5'
              }`}
              onClick={() => onSourceFilter?.(isSelected ? null : source.name)}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: source.color }}
                />
                <span className="text-sm text-white/80">
                  {getSourceDisplayName(source.name)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{source.value}</span>
                <span className="text-xs text-white/60">({percentage}%)</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter status */}
      {selectedSource && (
        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getSourceColor(selectedSource) }}
              />
              <span className="text-sm text-blue-300">
                Filtering by {getSourceDisplayName(selectedSource)}
              </span>
            </div>
            <button
              onClick={() => onSourceFilter?.(null)}
              className="text-xs text-blue-300 hover:text-blue-200 underline"
            >
              Clear filter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
