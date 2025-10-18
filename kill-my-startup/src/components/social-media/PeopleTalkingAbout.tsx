"use client"

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import SynchronizedAreaCharts from './SynchronizedAreaCharts'
import GroupedWordClouds from './GroupedWordClouds'
import ConversationSourceBreakdown from './ConversationSourceBreakdown'

interface EntityData {
  id: string
  name: string
  type: 'project' | 'competitor'
  metrics: Array<{
    hour: string
    volume: number
    positive: number
    negative: number
  }>
  wordTokens: Array<{
    token: string
    frequency: number
    sentiment: string
  }>
}

interface ConversationData {
  project: {
    id: string
    name: string
    description: string | null
    keywords: string[]
  }
  entities: EntityData[]
  recentMentions: Array<{
    id: string
    url: string
    text: string
    source: string
    sentiment: string
    sentimentScore: number | null
    publishedAt: string
    entity: {
      name: string
      type: 'project' | 'competitor'
    } | null
  }>
  sourceBreakdown: Record<string, number>
  timeRange: {
    from: string
    to: string
    days: number
  }
  timeWindow: string
}

interface PeopleTalkingAboutProps {
  projectId: string
  initialDays?: number
}

export default function PeopleTalkingAbout({ 
  projectId, 
  initialDays = 7 
}: PeopleTalkingAboutProps) {
  const [selectedDays, setSelectedDays] = useState(initialDays)
  const [selectedEntities, setSelectedEntities] = useState<string[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [timeWindow, setTimeWindow] = useState<'HOUR_24' | 'HOUR_48' | 'DAY_7' | 'DAY_30'>('DAY_7')

  // Fetch conversation data
  const fetchConversationData = async (projectId: string, days: number = 7): Promise<ConversationData> => {
    const response = await fetch(`/api/social-media/query?projectId=${projectId}&days=${days}&includeCompetitors=true`)
    if (!response.ok) {
      throw new Error('Failed to fetch conversation data')
    }
    return response.json()
  }

  const triggerSearch = async () => {
    try {
      setIsSearching(true)
      const response = await fetch('/api/social-media/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
        })
      })

      if (!response.ok) {
        throw new Error('Failed to trigger search')
      }

      const result = await response.json()
      console.log('Search completed:', result)
      
      // Refetch the data to show new results
      refetch()
    } catch (error) {
      console.error('Error triggering search:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conversations', projectId, selectedDays],
    queryFn: () => fetchConversationData(projectId, selectedDays),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
  })

  // Initialize selected entities when data loads
  React.useEffect(() => {
    if (data && selectedEntities.length === 0) {
      // Select project and first competitor by default
      const projectEntity = data.entities.find(e => e.type === 'project')
      const firstCompetitor = data.entities.find(e => e.type === 'competitor')
      
      const initialSelection = [projectEntity?.id, firstCompetitor?.id].filter(Boolean) as string[]
      setSelectedEntities(initialSelection)
    }
  }, [data, selectedEntities.length])

  // Handle entity toggle
  const handleEntityToggle = (entityId: string) => {
    setSelectedEntities(prev => 
      prev.includes(entityId) 
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    )
  }

  // Handle source filter
  const handleSourceFilter = (source: string | null) => {
    setSelectedSource(source)
  }

  // Filter entities based on selected source
  const filteredEntities = useMemo(() => {
    if (!data || !selectedSource) return data?.entities || []
    
    return data.entities.filter(entity => {
      // This would need to be implemented based on how we want to filter
      // For now, return all entities
      return true
    })
  }, [data, selectedSource])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">People Talking About</h2>
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
            <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white/5 rounded-lg border border-white/10 animate-pulse" />
          <div className="h-80 bg-white/5 rounded-lg border border-white/10 animate-pulse" />
        </div>
        
        <div className="h-48 bg-white/5 rounded-lg border border-white/10 animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">People Talking About</h2>
        </div>
        
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6">
          <div className="text-red-300 font-medium mb-2">Error loading conversation data</div>
          <div className="text-red-300/80 text-sm mb-4">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">People Talking About</h2>
        </div>
        
        <div className="bg-white/5 rounded-lg border border-white/10 p-6">
          <div className="text-center">
            <div className="text-white/60 text-sm mb-2">No conversation data available</div>
            <div className="text-white/40 text-xs">Data will appear as conversations are tracked</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">People Talking About</h2>
          <p className="text-white/60 text-sm mt-1">
            Conversation volume and sentiment for {data.project.name} and competitors
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <select
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value={1}>24h</option>
            <option value={7}>7d</option>
            <option value={30}>30d</option>
          </select>
          
          {/* Time window selector */}
          <select
            value={timeWindow}
            onChange={(e) => setTimeWindow(e.target.value as any)}
            className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white"
          >
            <option value="HOUR_24">24h</option>
            <option value="HOUR_48">48h</option>
            <option value="DAY_7">7d</option>
            <option value="DAY_30">30d</option>
          </select>
          
          {/* Search button */}
          <button
            onClick={triggerSearch}
            disabled={isSearching}
            className="px-4 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isSearching ? 'Searching...' : 'Search Now'}
          </button>
          
          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white hover:bg-white/20 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="space-y-6">
        {/* Synchronized Area Charts */}
        <SynchronizedAreaCharts
          entities={filteredEntities}
          selectedEntities={selectedEntities}
          onEntityToggle={handleEntityToggle}
          timeRange={data.timeRange}
        />
        
        {/* Grouped Word Clouds */}
        <GroupedWordClouds
          entities={filteredEntities}
          selectedEntities={selectedEntities}
          maxWordsPerEntity={15}
        />

        {/* Source breakdown */}
        <div className="flex flex-col lg:flex-row gap-6" style={{ alignItems: 'stretch' }}>
          <div className="flex-1 lg:flex-[2]">
            <ConversationSourceBreakdown
              sourceBreakdown={data.sourceBreakdown}
              onSourceFilter={handleSourceFilter}
              selectedSource={selectedSource}
            />
          </div>
          
          {/* Recent mentions */}
          <div className="flex-1 bg-white/5 rounded-lg border border-white/10 p-6 flex flex-col" style={{ height: 'fit-content' }}>
            <h3 className="text-sm font-medium text-white mb-4">Recent Mentions</h3>
            <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '300px' }}>
              {data.recentMentions.slice(0, 10).map((mention) => (
                <div key={mention.id} className="border-l-2 border-blue-500/30 pl-3 space-y-1">
                  <div className="text-xs text-white/80 line-clamp-2">{mention.text}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/60">{mention.source}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      mention.sentiment === 'POSITIVE' ? 'bg-green-500/20 text-green-300' :
                      mention.sentiment === 'NEGATIVE' ? 'bg-red-500/20 text-red-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {mention.sentiment.toLowerCase()}
                    </span>
                  </div>
                  <div className="text-xs text-white/50">
                    {mention.entity?.name} • {new Date(mention.publishedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
