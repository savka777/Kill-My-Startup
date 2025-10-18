"use client"

import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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

interface MergedConversationChartProps {
  entities: EntityData[]
  selectedEntities: string[]
  onEntityToggle: (entityId: string) => void
  timeRange: {
    from: string
    to: string
    days: number
  }
}

// Black theme color palette with gradients for area charts
const getEntityColor = (index: number): { stroke: string; fill: string; gradientId: string } => {
  const colorSets = [
    { stroke: '#FFFFFF', fill: '#FFFFFF', gradientId: 'gradient-white' },
    { stroke: '#E5E7EB', fill: '#E5E7EB', gradientId: 'gradient-light-gray' },
    { stroke: '#D1D5DB', fill: '#D1D5DB', gradientId: 'gradient-gray' },
    { stroke: '#9CA3AF', fill: '#9CA3AF', gradientId: 'gradient-medium-gray' },
    { stroke: '#6B7280', fill: '#6B7280', gradientId: 'gradient-dark-gray' },
    { stroke: '#4B5563', fill: '#4B5563', gradientId: 'gradient-darker-gray' },
    { stroke: '#374151', fill: '#374151', gradientId: 'gradient-very-dark-gray' },
    { stroke: '#1F2937', fill: '#1F2937', gradientId: 'gradient-almost-black' }
  ]
  return colorSets[index % colorSets.length]
}

// Format data for Recharts - only volume data, no sentiment counts
const formatChartData = (entities: EntityData[], selectedEntities: string[]) => {
  const selectedEntitiesData = entities.filter(entity => selectedEntities.includes(entity.id))
  
  if (selectedEntitiesData.length === 0) return []

  // Get all unique time points
  const allTimePoints = new Set<string>()
  selectedEntitiesData.forEach(entity => {
    entity.metrics.forEach(metric => allTimePoints.add(metric.hour))
  })

  // Create data points for each time
  return Array.from(allTimePoints).map(timePoint => {
    const dataPoint: any = { time: timePoint }
    
    selectedEntitiesData.forEach(entity => {
      const metric = entity.metrics.find(m => m.hour === timePoint)
      if (metric) {
        dataPoint[`${entity.name}_volume`] = metric.volume
      } else {
        dataPoint[`${entity.name}_volume`] = 0
      }
    })
    
    return dataPoint
  }).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
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
            <span className="text-white/80">{entry.dataKey.replace('_volume', '')}:</span>
            <span className="text-white font-medium">{entry.value} mentions</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// Custom legend with black theme
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap gap-4 justify-center mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className="text-white/80 text-sm">{entry.value.replace('_volume', '')}</span>
        </div>
      ))}
    </div>
  )
}

export default function MergedConversationChart({
  entities,
  selectedEntities,
  onEntityToggle,
  timeRange
}: MergedConversationChartProps) {
  const chartData = formatChartData(entities, selectedEntities)
  const selectedEntitiesData = entities.filter(entity => selectedEntities.includes(entity.id))

  if (chartData.length === 0) {
    return (
      <div className="bg-black/50 rounded-lg border border-white/10 p-6 h-80 flex items-center justify-center">
        <div className="text-white/60 text-sm">No data available</div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-white mb-2">Conversation Volume</h3>
        <p className="text-sm text-white/60">
          {format(parseISO(timeRange.from), 'MMM dd')} - {format(parseISO(timeRange.to), 'MMM dd')}
        </p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            style={{ backgroundColor: 'transparent' }}
            syncId="conversationVolume"
          >
            <defs>
              {selectedEntitiesData.map((entity, index) => {
                const colors = getEntityColor(index)
                return (
                  <linearGradient key={colors.gradientId} id={colors.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.fill} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={colors.fill} stopOpacity={0.1}/>
                  </linearGradient>
                )
              })}
            </defs>
            <CartesianGrid stroke="#374151" strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            
            {selectedEntitiesData.map((entity, index) => {
              const colors = getEntityColor(index)
              return (
                <Area
                  key={entity.id}
                  type="monotone"
                  dataKey={`${entity.name}_volume`}
                  stroke={colors.stroke}
                  strokeWidth={2}
                  fill={`url(#${colors.gradientId})`}
                  fillOpacity={0.6}
                  dot={{ fill: colors.stroke, strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: colors.stroke, strokeWidth: 2, fill: colors.stroke }}
                  name={entity.name}
                />
              )
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Entity toggles */}
      <div className="mt-4 flex flex-wrap gap-2">
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
                ? `2px solid ${getEntityColor(index).stroke}` 
                : '2px solid transparent'
            }}
          >
            {entity.name}
          </button>
        ))}
      </div>
    </div>
  )
}
