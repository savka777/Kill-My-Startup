"use client"

import React, { useMemo } from 'react'
import WordCloudCard, { WordDatum } from '@/components/WordCloudCard'

interface WordToken {
  token: string
  frequency: number
  sentiment: string
}

interface EntityData {
  id: string
  name: string
  type: 'project' | 'competitor'
  wordTokens: WordToken[]
}

interface GroupedWordCloudsProps {
  entities: EntityData[]
  selectedEntities: string[]
  maxWordsPerEntity?: number
}

// Convert sentiment string to number
const sentimentToNumber = (sentiment: string): number => {
  switch (sentiment) {
    case 'POSITIVE':
      return 0.5
    case 'NEGATIVE':
      return -0.5
    case 'NEUTRAL':
    default:
      return 0
  }
}

// Words to exclude (names, common non-sentiment words)
const excludedWords = new Set([
  // Common names and entities
  'perplexity', 'google', 'microsoft', 'apple', 'amazon', 'meta', 'facebook', 'twitter', 'linkedin',
  'openai', 'anthropic', 'claude', 'chatgpt', 'gpt', 'bard', 'gemini', 'copilot',
  'brave', 'bing', 'duckduckgo', 'yahoo', 'yandex', 'baidu',
  'startup', 'company', 'business', 'corp', 'inc', 'llc', 'ltd',
  
  // Common non-sentiment words
  'search', 'engine', 'browser', 'tool', 'platform', 'service', 'app', 'application',
  'website', 'site', 'web', 'internet', 'online', 'digital', 'tech', 'technology',
  'user', 'users', 'people', 'person', 'customer', 'customers', 'client', 'clients',
  'time', 'day', 'week', 'month', 'year', 'today', 'yesterday', 'tomorrow',
  'way', 'ways', 'thing', 'things', 'stuff', 'something', 'anything', 'everything',
  'here', 'there', 'where', 'when', 'how', 'what', 'why', 'which', 'who',
  'this', 'that', 'these', 'those', 'them', 'they', 'their', 'theirs',
  'use', 'using', 'used', 'uses', 'usage', 'utilize', 'utilization',
  'get', 'got', 'getting', 'give', 'gave', 'giving', 'take', 'took', 'taking',
  'make', 'made', 'making', 'do', 'did', 'doing', 'done', 'work', 'works', 'working',
  'go', 'went', 'going', 'come', 'came', 'coming', 'see', 'saw', 'seeing', 'seen',
  'know', 'knew', 'knowing', 'known', 'think', 'thought', 'thinking',
  'want', 'wanted', 'wanting', 'need', 'needed', 'needing', 'like', 'liked', 'liking',
  'good', 'bad', 'better', 'best', 'worse', 'worst', 'great', 'awesome', 'amazing',
  'nice', 'cool', 'fine', 'okay', 'ok', 'yes', 'no', 'maybe', 'perhaps', 'probably',
  'very', 'really', 'quite', 'pretty', 'rather', 'somewhat', 'kind', 'sort',
  'just', 'only', 'even', 'still', 'also', 'too', 'either', 'neither', 'both',
  'all', 'some', 'any', 'every', 'each', 'other', 'another', 'more', 'most', 'less', 'least',
  'first', 'last', 'next', 'previous', 'before', 'after', 'during', 'while', 'until',
  'about', 'above', 'below', 'under', 'over', 'through', 'across', 'around', 'between',
  'among', 'within', 'without', 'inside', 'outside', 'beside', 'behind', 'front',
  'up', 'down', 'left', 'right', 'top', 'bottom', 'middle', 'center', 'side',
  'new', 'old', 'young', 'big', 'small', 'large', 'little', 'huge', 'tiny',
  'long', 'short', 'high', 'low', 'deep', 'shallow', 'wide', 'narrow', 'thick', 'thin',
  'fast', 'slow', 'quick', 'rapid', 'easy', 'hard', 'difficult', 'simple', 'complex',
  'free', 'paid', 'cost', 'price', 'money', 'dollar', 'dollars', 'cost', 'expensive', 'cheap',
  'free', 'available', 'unavailable', 'access', 'accessible', 'inaccessible'
])

// Check if word should be included (sentiment-defining words)
const isSentimentWord = (word: string): boolean => {
  const lowerWord = word.toLowerCase()
  
  // Exclude if in excluded words set
  if (excludedWords.has(lowerWord)) return false
  
  // Exclude very short words (less than 3 characters)
  if (lowerWord.length < 3) return false
  
  // Exclude words that are mostly numbers or special characters
  if (/^[0-9\W]+$/.test(lowerWord)) return false
  
  // Include words that are likely sentiment-defining
  return true
}

export default function GroupedWordClouds({
  entities,
  selectedEntities,
  maxWordsPerEntity = 15
}: GroupedWordCloudsProps) {
  // Process words for each entity, filtering by selected entities
  const processedEntities = useMemo(() => {
    return entities
      .filter(entity => selectedEntities.includes(entity.id)) // Only show selected entities
      .map(entity => {
      const safeTokens = Array.isArray(entity.wordTokens) ? entity.wordTokens : []
      
      // Filter out non-sentiment words and names
      const filteredTokens = safeTokens.filter(token => 
        isSentimentWord(token.token)
      )

      // Sort by frequency and take top words
      const sortedTokens = [...filteredTokens]
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, maxWordsPerEntity)

      const words: WordDatum[] = sortedTokens.map(token => ({
        text: token.token,
        count: token.frequency,
        sentiment: sentimentToNumber(token.sentiment),
        recentWeight: 0.8 // Default weight
      }))

      // Calculate sentiment breakdown
      const sentimentBreakdown = words.reduce((acc, word) => {
        if (word.sentiment && word.sentiment > 0.05) {
          acc.positive += 1
        } else if (word.sentiment && word.sentiment < -0.05) {
          acc.negative += 1
        } else {
          acc.neutral += 1
        }
        return acc
      }, { positive: 0, negative: 0, neutral: 0 })

      return {
        ...entity,
        words,
        wordCount: words.length,
        sentimentBreakdown
      }
    })
  }, [entities, selectedEntities, maxWordsPerEntity])

  // Show message when no entities are selected
  if (processedEntities.length === 0) {
    return (
      <div className="bg-white/5 rounded-lg border border-white/10 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-2">Keyword Analysis</h3>
          <p className="text-sm text-white/60">Most relevant sentiment-defining words by entity</p>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-white/60 text-sm">Select entities above to view their word clouds</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 rounded-lg border border-white/10 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-white mb-2">Keyword Analysis</h3>
        <p className="text-sm text-white/60">Most relevant sentiment-defining words by entity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {processedEntities.map((entity) => (
          <div key={entity.id} className="space-y-3">
            {/* Entity Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">{entity.name}</h4>
              <div className="flex items-center gap-3 text-xs">
                <div className="text-white/60">{entity.wordCount} words</div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4ADE80' }}></div>
                      <span className="text-white/60">{entity.sentimentBreakdown.positive}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FB7185' }}></div>
                      <span className="text-white/60">{entity.sentimentBreakdown.negative}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#93C5FD' }}></div>
                      <span className="text-white/60">{entity.sentimentBreakdown.neutral}</span>
                    </div>
                  </div>
              </div>
            </div>

            {/* Word Cloud */}
            <WordCloudCard
              title=""
              words={entity.words}
              topN={maxWordsPerEntity}
              minFont={14}
              maxFont={36}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
