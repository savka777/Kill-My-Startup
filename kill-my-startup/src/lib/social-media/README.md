# Social Media Scraping & Analysis

This directory contains all the backend logic for social media conversation tracking and analysis.

## Files

- **`conversation.ts`** - API providers for three search strategies:
  - Twitter & Reddit (RapidAPI + Perplexity Sonar)
  - Hacker News & Product Hunt (Perplexity Search)
  - General Social Media (Perplexity Search)
  - Sentiment analysis and token extraction

- **`conversations.ts`** - Seed script for testing data:
  - Creates fake project with competitors
  - Generates sample conversation mentions
  - Pre-computes metrics and word cloud tokens

## Usage

```typescript
import { fetchTwitterMentions, analyzeSentiment } from '@/lib/social-media/conversation'
import { seedConversationData } from '@/lib/social-media/conversations'
```
