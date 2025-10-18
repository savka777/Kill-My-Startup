# Social Media API Endpoints

This directory contains all the API endpoints for social media conversation tracking and analysis.

## Endpoints

### `/api/social-media/ingest`
**POST** - Hourly cron job for data collection:
- Fetches conversations from all sources (Twitter, Reddit, HN, PH, forums, blogs)
- Processes sentiment analysis and token extraction
- Stores raw mentions and aggregated metrics
- Generates word cloud tokens for different time windows
- **Schedule**: Every hour (`0 * * * *`)

### `/api/social-media/query`
**GET** - Dashboard data endpoint:
- Returns conversation data for visualization
- Supports filtering by time range and entities
- Returns metrics, word tokens, and recent mentions
- **Parameters**: `projectId`, `days`, `includeCompetitors`, `timeWindow`

## Usage

```typescript
// Fetch conversation data
const response = await fetch('/api/social-media/query?projectId=123&days=7')

// Trigger data ingestion (usually called by cron)
const response = await fetch('/api/social-media/ingest', {
  method: 'POST',
  body: JSON.stringify({ projectId: '123' })
})
```

## Data Flow

1. **Ingestion** (`/ingest`): Collects data from external APIs
2. **Processing**: Analyzes sentiment and extracts tokens
3. **Storage**: Saves to database with proper relationships
4. **Query** (`/query`): Retrieves processed data for dashboard
5. **Visualization**: Components display the data with charts and word clouds
