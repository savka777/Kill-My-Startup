"use client"

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'

interface MetricData {
  hour: string
  volume: number
  positive: number
  negative: number
}

interface EntityData {
  id: string
  name: string
  type: 'project' | 'competitor'
  metrics: MetricData[]
  wordTokens: Array<{ token: string; frequency: number; sentiment: string }>
}

interface SynchronizedAreaChartsProps {
  entities: EntityData[]
  selectedEntities: string[]
  onEntityToggle: (entityId: string) => void
  timeRange: {
    from: string
    to: string
    days: number
  }
}

// Brand-based color palette for entities
const getEntityColor = (entityName: string, index: number): { stroke: string; fill: string; gradientId: string } => {
  // Brand colors based on entity names
  const brandColors: Record<string, { stroke: string; fill: string; gradientId: string }> = {
    'Test Startup': { stroke: '#3B82F6', fill: '#3B82F6', gradientId: 'gradient-blue' }, // Blue
    'Perplexity AI': { stroke: '#8B5CF6', fill: '#8B5CF6', gradientId: 'gradient-purple' }, // Purple
    'Google Search': { stroke: '#10B981', fill: '#10B981', gradientId: 'gradient-green' }, // Green
    'Brave Search': { stroke: '#F59E0B', fill: '#F59E0B', gradientId: 'gradient-orange' }, // Orange
    'StartupKiller AI': { stroke: '#EF4444', fill: '#EF4444', gradientId: 'gradient-red' }, // Red
    'YC Startup School': { stroke: '#06B6D4', fill: '#06B6D4', gradientId: 'gradient-cyan' }, // Cyan
    'AngelList': { stroke: '#EC4899', fill: '#EC4899', gradientId: 'gradient-pink' }, // Pink
    'Product Hunt': { stroke: '#14B8A6', fill: '#14B8A6', gradientId: 'gradient-teal' }, // Teal
    'Indie Hackers': { stroke: '#6366F1', fill: '#6366F1', gradientId: 'gradient-indigo' }, // Indigo
  }
  
  // Fallback colors for unknown entities
  const fallbackColors = [
    { stroke: '#6B7280', fill: '#6B7280', gradientId: 'gradient-gray' },
    { stroke: '#9CA3AF', fill: '#9CA3AF', gradientId: 'gradient-light-gray' },
    { stroke: '#D1D5DB', fill: '#D1D5DB', gradientId: 'gradient-lighter-gray' },
    { stroke: '#E5E7EB', fill: '#E5E7EB', gradientId: 'gradient-lightest-gray' }
  ]
  
  return brandColors[entityName] || fallbackColors[index % fallbackColors.length]
}

// Format data for individual entity charts
const formatEntityData = (entity: EntityData) => {
  return entity.metrics.map(metric => ({
    time: metric.hour,
    volume: metric.volume,
    positive: metric.positive,
    negative: metric.negative
  })).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
}

// Custom tooltip with black theme
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const time = new Date(label)
    return (
      <div className="bg-black/95 text-white p-4 rounded-lg border border-white/20 shadow-lg">
        <p className="text-sm font-medium mb-2">
          {format(time, 'MMM dd, HH:mm')}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-white/80">{entry.dataKey}:</span>
            <span className="text-white font-medium">{entry.value} mentions</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function SynchronizedAreaCharts({
  entities,
  selectedEntities,
  onEntityToggle,
  timeRange
}: SynchronizedAreaChartsProps) {
  const selectedEntitiesData = entities.filter(entity => selectedEntities.includes(entity.id))

  if (selectedEntitiesData.length === 0) {
    return (
      <div className="bg-black/50 rounded-lg border border-white/10 p-6">
        <div className="text-white/60 text-sm">No entities selected</div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-2">Synchronized Conversation Volume</h3>
        <p className="text-sm text-white/60">
          {format(parseISO(timeRange.from), 'MMM dd')} - {format(parseISO(timeRange.to), 'MMM dd')}
        </p>
        <p className="text-xs text-white/50 mt-1">
          Hover over any chart to see synchronized interactions across all charts. Selected entities will show their word clouds below.
        </p>
      </div>

      <div className="space-y-6">
        {selectedEntitiesData.map((entity, index) => {
          const colors = getEntityColor(entity.name, index)
          const entityData = formatEntityData(entity)
          
          return (
            <div key={entity.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">{entity.name}</h4>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: colors.stroke }}
                  ></div>
                  <span className="text-xs text-white/60">
                    {entityData.reduce((sum, item) => sum + item.volume, 0)} total mentions
                  </span>
                </div>
              </div>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={entityData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    style={{ backgroundColor: 'transparent' }}
                    syncId="conversationVolume"
                  >
                    <defs>
                      <linearGradient id={colors.gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colors.fill} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={colors.fill} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#9CA3AF"
                      fontSize={10}
                      tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={10}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke={colors.stroke}
                      strokeWidth={2}
                      fill={`url(#${colors.gradientId})`}
                      fillOpacity={0.6}
                      dot={{ fill: colors.stroke, strokeWidth: 2, r: 2 }}
                      activeDot={{ r: 4, stroke: colors.stroke, strokeWidth: 2, fill: colors.stroke }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )
        })}
      </div>

      {/* Entity toggles */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex flex-wrap gap-2">
          {entities.map((entity, index) => (
            <button
              key={entity.id}
              onClick={() => onEntityToggle(entity.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedEntities.includes(entity.id)
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
              style={{
                border: selectedEntities.includes(entity.id) 
                  ? `2px solid ${getEntityColor(entity.name, index).stroke}` 
                  : '2px solid transparent'
              }}
            >
              {entity.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
