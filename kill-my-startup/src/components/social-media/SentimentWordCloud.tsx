"use client"

import React, { useMemo } from 'react'
import WordCloudCard, { WordDatum } from '@/components/WordCloudCard'

interface WordToken {
  token: string
  frequency: number
  sentiment: string
}

interface SentimentWordCloudProps {
  wordTokens: WordToken[]
  entityName: string
  maxWords?: number
  size?: { width: number; height: number }
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


export default function SentimentWordCloud({
  wordTokens: tokens,
  entityName,
  maxWords = 30,
  size = { width: 300, height: 200 }
}: SentimentWordCloudProps) {
  // Add safety check for tokens prop
  const safeTokens = Array.isArray(tokens) ? tokens : []

  // Process and format data for word cloud
  const words: WordDatum[] = useMemo(() => {
    if (!safeTokens || safeTokens.length === 0) {
      return []
    }

    try {
      // Filter out non-sentiment words and names
      const filteredTokens = safeTokens.filter(token => 
        isSentimentWord(token.token)
      )

      // Sort by frequency and take top words
      const sortedTokens = [...filteredTokens]
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, maxWords)

      return sortedTokens.map(token => ({
        text: token.token,
        count: token.frequency,
        sentiment: sentimentToNumber(token.sentiment),
        recentWeight: 0.8 // Default weight
      }))
    } catch (error) {
      console.error('SentimentWordCloud - Error processing tokens:', error)
      return []
    }
  }, [safeTokens, maxWords])

  // Early return if no valid data
  if (!safeTokens || safeTokens.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">{entityName} Keywords</h3>
          <div className="text-xs text-white/60">0 words</div>
        </div>
        
        <div className="bg-white/5 rounded-lg border border-white/10 p-4">
          <div className="flex items-center justify-center h-32">
            <div className="text-white/60 text-sm">No word data available</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <WordCloudCard
      title={`${entityName} Keywords`}
      words={words}
      topN={maxWords}
      minFont={16}
      maxFont={48}
      className="w-full"
    />
  )
}