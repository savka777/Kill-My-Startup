**Kill My Startup** — “Real-time market intelligence for founders. Get live metrics about your space, competitors, and audience sentiment — all powered by Perplexity Search.”

Imagine a dashboard that **updates itself every 6–12 hours**.  

- **“General information”** → summary of recent funding rounds and amounts for competitors

- **“People talking about this”** → sparkline chart
    - **“User sentiment”** → aggregated word cloud (“love”, “boring”, “expensive”)

- **“Competitors launched”** → timeline
    - **“Funding activity”** → timeline graph (recent funding rounds, amounts)
    
- **“Revenue monitoring”** → line chart (monthly recurring revenue, customer growth)

- **“Top recent news”** → Perplexity-powered summaries
    - **“Hiring signals”** → list of companies hiring in this space

## General information
- Summary of recent funding rounds and amounts for competitors.
    - Relevant competitiors would be updated each day based on news and market trends.
- Data sources: Crunchbase, PitchBook, relevant news articles.
- Frequency: Every day.

## People talking about this

### Chart
- Track the volume of online conversations about your startup idea over time.
- Track the volume of online conversations about competitors over time. 5-10 competitors would be choosen in the initial setup and can be updated later.
- Data sources: Twitter, Reddit, Hacker News, Product Hunt, relevant forums and blogs.
- Frequency: Every hour.

### User sentiment
- Generate a word cloud highlighting the most frequently used words and phrases associated with positive and negative sentiments
    - About your startup idea located nerby the sparkline chart of your startup idea.
    - About competitors located nerby the sparkline chart of competitors.
- Data sources: Twitter, Reddit, Hacker News, relevant forums and blogs.
- Frequency: Every hour.

## Competitors launched
### Timeline
- It should be a timeline graph showing launch dates and following major milestones of competitors like funding rounds, new feature releases, partnerships, etc.
- Data sources: Product Hunt, TechCrunch, Landing pages, Linkedin relevant blogs and forums.
- Frequency: Every day.

## Revenue monitoring
- Monitor key revenue metrics for competitors, such as monthly recurring revenue and customer growth.
- Data sources: Competitors' websites, press releases, funding announcements.
- Frequency: Every day.

## Top recent news

### Perplexity-powered summaries
- Summarize the most recent news articles related to your startup idea and competitors.
- Data sources: Google News, RSS feeds, relevant blogs and forums.
- Frequency: Every day.

### Hiring signals
- Identify companies that are actively hiring in your startup's space. If they hire someone important (e.g., VP of Sales, Head of Engineering, Great Reseacher, Product Manager, etc.), it could indicate growth or new initiatives.
- Data sources: LinkedIn, Indeed, company career pages.
- Frequency: Every day.


## Project Structure

### Social Media Scraping & Analysis
- **`src/lib/social-media/`** - Backend logic for conversation tracking
  - `conversation.ts` - API providers for Twitter, Reddit, HN, PH, forums
  - `conversations.ts` - Seed script for testing data
- **`src/components/social-media/`** - Frontend visualization components
  - `PeopleTalkingAbout.tsx` - Main container component
  - `ConversationVolumeChart.tsx` - Volume charts with Recharts
  - `SentimentWordCloud.tsx` - Interactive word clouds
  - `ConversationSourceBreakdown.tsx` - Source distribution charts
- **`src/app/api/social-media/`** - API endpoints
  - `ingest/` - Hourly data collection cron job
  - `query/` - Dashboard data retrieval

### Key Features
- **Three-tier search strategy**: RapidAPI + Perplexity for comprehensive coverage
- **Real-time sentiment analysis**: Using Perplexity Sonar for accurate classification
- **Interactive visualizations**: Charts, word clouds, and source breakdowns
- **Hourly data collection**: Automated cron jobs for fresh data
- **Testing support**: Seed scripts for development without API calls

## Getting Started
To get started with Kill My Startup, follow these steps:
1. Set up environment variables (see `ENVIRONMENT_SETUP.md`)
2. Install dependencies: `npm install --legacy-peer-deps`
3. Run database migration: `npx prisma db push`
4. Seed test data: `npm run seed:conversations`
5. Start development server: `npm run dev`