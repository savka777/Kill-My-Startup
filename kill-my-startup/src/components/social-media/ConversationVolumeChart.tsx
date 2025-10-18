"use client"

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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

interface ConversationVolumeChartProps {
  entities: EntityData[]
  selectedEntities: string[]
  onEntityToggle: (entityId: string) => void
  timeRange: {
    from: string
    to: string
    days: number
  }
}

// Enhanced color palette matching Source Breakdown
const getEntityColor = (index: number): string => {
  const colors = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#10B981', // Green
    '#F59E0B', // Orange
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#EF4444', // Red
    '#6B7280'  // Gray
  ]
  return colors[index % colors.length]
}

// Format data for Recharts
const formatChartData = (entities: EntityData[], selectedEntities: string[]) => {
  const selectedEntitiesData = entities.filter(entity => selectedEntities.includes(entity.id))
  
  if (selectedEntitiesData.length === 0) return []

  // Get all unique hours from all selected entities
  const allHours = new Set<string>()
  selectedEntitiesData.forEach(entity => {
    entity.metrics.forEach(metric => allHours.add(metric.hour))
  })

  // Create chart data points
  return Array.from(allHours)
    .sort()
    .map(hour => {
      const dataPoint: any = {
        hour: format(parseISO(hour), 'MMM dd HH:mm'),
        timestamp: hour
      }

      selectedEntitiesData.forEach(entity => {
        const entityMetric = entity.metrics.find(m => m.hour === hour)
        if (entityMetric) {
          dataPoint[`${entity.name}_volume`] = entityMetric.volume
          dataPoint[`${entity.name}_positive`] = entityMetric.positive
          dataPoint[`${entity.name}_negative`] = entityMetric.negative
        } else {
          dataPoint[`${entity.name}_volume`] = 0
          dataPoint[`${entity.name}_positive`] = 0
          dataPoint[`${entity.name}_negative`] = 0
        }
      })

      return dataPoint
    })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 text-white p-3 rounded-lg border border-white/20">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-white/80">{entry.dataKey.replace('_volume', '')}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function ConversationVolumeChart({
  entities,
  selectedEntities,
  onEntityToggle,
  timeRange
}: ConversationVolumeChartProps) {
  const chartData = formatChartData(entities, selectedEntities)
  const selectedEntitiesData = entities.filter(entity => selectedEntities.includes(entity.id))

  return (
    <div className="space-y-4">
      {/* Entity toggles */}
      <div className="flex flex-wrap gap-2">
        {entities.map((entity, index) => (
          <label
            key={entity.id}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedEntities.includes(entity.id)}
              onChange={() => onEntityToggle(entity.id)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getEntityColor(index) }}
              />
              <span className="text-sm text-white/80">
                {entity.name}
                <span className="ml-1 text-xs text-white/60">
                  ({entity.type})
                </span>
              </span>
            </div>
          </label>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="hour" 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {selectedEntitiesData.map((entity, index) => (
              <Line
                key={entity.id}
                type="monotone"
                dataKey={`${entity.name}_volume`}
                stroke={getEntityColor(index)}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={entity.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-white/60 text-xs">Total Volume</div>
          <div className="text-lg font-semibold text-white">
            {chartData.reduce((sum, point) => {
              return sum + selectedEntitiesData.reduce((entitySum, entity) => {
                return entitySum + (point[`${entity.name}_volume`] || 0)
              }, 0)
            }, 0)}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-white/60 text-xs">Positive Mentions</div>
          <div className="text-lg font-semibold text-green-400">
            {chartData.reduce((sum, point) => {
              return sum + selectedEntitiesData.reduce((entitySum, entity) => {
                return entitySum + (point[`${entity.name}_positive`] || 0)
              }, 0)
            }, 0)}
          </div>
        </div>
        
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-white/60 text-xs">Negative Mentions</div>
          <div className="text-lg font-semibold text-red-400">
            {chartData.reduce((sum, point) => {
              return sum + selectedEntitiesData.reduce((entitySum, entity) => {
                return entitySum + (point[`${entity.name}_negative`] || 0)
              }, 0)
            }, 0)}
          </div>
        </div>
      </div>
    </div>
  )
}
