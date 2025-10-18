# Social Media Scraping & Analysis - File Structure

## Overview
All social media conversation tracking and analysis functionality has been organized into dedicated subfolders for better maintainability and clarity.

## Directory Structure

```
src/
├── lib/social-media/                    # Backend logic for conversation tracking
│   ├── conversation.ts                 # API providers for three search strategies
│   ├── conversations.ts                # Seed script for testing data
│   └── README.md                       # Documentation for lib functions
│
├── components/social-media/             # Frontend visualization components
│   ├── PeopleTalkingAbout.tsx          # Main container component
│   ├── ConversationVolumeChart.tsx     # Volume charts with Recharts
│   ├── SentimentWordCloud.tsx          # Interactive word clouds
│   ├── ConversationSourceBreakdown.tsx # Source distribution charts
│   └── README.md                       # Documentation for components
│
└── app/api/social-media/               # API endpoints
    ├── ingest/route.ts                 # Hourly data collection cron job
    ├── query/route.ts                  # Dashboard data retrieval
    └── README.md                       # Documentation for API endpoints
```

## Key Features by Directory

### `src/lib/social-media/`
- **Three-tier search strategy**:
  - Strategy 1: Twitter & Reddit (RapidAPI + Perplexity Sonar)
  - Strategy 2: Hacker News & Product Hunt (Perplexity Search)
  - Strategy 3: General Social Media (Perplexity Search)
- **Sentiment analysis** using Perplexity Sonar
- **Token extraction** and word cloud generation
- **Seed script** for testing without API calls

### `src/components/social-media/`
- **Interactive visualizations**:
  - Multi-line volume charts with entity toggles
  - Sentiment-colored word clouds
  - Source breakdown pie charts
- **Real-time updates** with TanStack Query
- **Responsive design** with loading states
- **Time range controls** (24h, 7d, 30d)

### `src/app/api/social-media/`
- **`/ingest`** - Hourly cron job for data collection
- **`/query`** - Dashboard data retrieval with filtering
- **Idempotent design** with unique URL constraints
- **Error handling** and fallback mechanisms

## Configuration Files

- **`vercel.json`** - Updated cron job path: `/api/social-media/ingest`
- **`package.json`** - Added `seed:conversations` script
- **`ENVIRONMENT_SETUP.md`** - API keys and configuration guide

## Usage Examples

### Backend (lib)
```typescript
import { fetchTwitterMentions, analyzeSentiment } from '@/lib/social-media/conversation'
import { seedConversationData } from '@/lib/social-media/conversations'
```

### Frontend (components)
```typescript
import PeopleTalkingAbout from '@/components/social-media/PeopleTalkingAbout'
import ConversationVolumeChart from '@/components/social-media/ConversationVolumeChart'
```

### API (endpoints)
```typescript
// Fetch conversation data
const response = await fetch('/api/social-media/query?projectId=123&days=7')

// Trigger data ingestion
const response = await fetch('/api/social-media/ingest', {
  method: 'POST',
  body: JSON.stringify({ projectId: '123' })
})
```

## Benefits of This Structure

1. **Clear separation of concerns** - Each directory has a specific purpose
2. **Easy to find related files** - All social media functionality is grouped together
3. **Maintainable codebase** - Changes to social media features are isolated
4. **Scalable architecture** - Easy to add new social media sources or visualizations
5. **Team collaboration** - Different team members can work on different aspects without conflicts

## Next Steps

1. **Install dependencies**: `npm install --legacy-peer-deps`
2. **Set up environment variables**: See `ENVIRONMENT_SETUP.md`
3. **Run database migration**: `npx prisma db push`
4. **Seed test data**: `npm run seed:conversations`
5. **Start development**: `npm run dev`

The social media scraping and analysis system is now fully organized and ready for development!
