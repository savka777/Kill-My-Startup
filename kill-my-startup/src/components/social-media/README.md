# Social Media Visualization Components

This directory contains all the frontend components for displaying social media conversation data.

## Components

- **`PeopleTalkingAbout.tsx`** - Main container component:
  - Fetches conversation data using TanStack Query
  - Manages state for selected entities and time ranges
  - Renders grid layout with charts and word clouds

- **`ConversationVolumeChart.tsx`** - Volume chart component:
  - Multi-line time series chart using Recharts
  - Shows hourly conversation volume over time
  - Toggle switches for different entities
  - Interactive tooltips and legends

- **`SentimentWordCloud.tsx`** - Word cloud component:
  - Interactive word cloud with sentiment colors
  - Real-time updates based on time window
  - Sentiment breakdown and top words list
  - Hover effects showing frequency and sentiment

- **`ConversationSourceBreakdown.tsx`** - Source breakdown component:
  - Pie chart showing platform distribution
  - Interactive filtering by source
  - Percentage breakdown and click-to-filter functionality

## Usage

```typescript
import PeopleTalkingAbout from '@/components/social-media/PeopleTalkingAbout'
import ConversationVolumeChart from '@/components/social-media/ConversationVolumeChart'
import SentimentWordCloud from '@/components/social-media/SentimentWordCloud'
import ConversationSourceBreakdown from '@/components/social-media/ConversationSourceBreakdown'
```
