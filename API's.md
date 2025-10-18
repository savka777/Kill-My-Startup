APIs Overview and Handoff

This document explains how the backend APIs work, what value they provide, required environment/config, and known issues/limitations. Use it to continue development or integrate new features safely.

Architecture
- Next.js App Router routes under `src/app/api/*`.
- Prisma as data layer (caching and analytics storage).
- External search via Perplexity SDK (`@perplexity-ai/perplexity_ai`).
- In-app caches to reduce cost/latency: competitor and news caches in Prisma.

Environment
- `PERPLEXITY_API_KEY` required for Perplexity Search.
- `NEXT_PUBLIC_APP_URL` optional; used when this app calls its own routes (defaults to `http://localhost:3000`).

Competitors API
- File: kill-my-startup/src/app/api/competitors/route.ts:1
- Purpose: Discover competitors in a given industry/context using Perplexity, then normalize/enrich fields and cache.

Endpoints
- POST `/api/competitors`
- Body fields:
  - `industry` string (required)
  - `context` string (optional) — free text describing the startup for better matching
  - `userInfo` string (optional)
  - `max_results` number (default 8)
  - `forceRefresh` boolean (default false)
- Response fields:
  - `competitors`: array with `name`, `website`, `industry`, `foundedYear`, `employeeCount`, `valuation`, `lastFunding`, `fundingAmount`, `stage`, `riskLevel`
  - `total_competitors`, `fromCache`, `lastFetch`

Perplexity integration
- Query generation: kill-my-startup/src/app/api/competitors/route.ts:114
- Example queries it sends:
  - `companies similar to {context || industry} with website valuation funding`
  - `{industry} startups companies with valuation website crunchbase`
  - `public private companies {industry} market cap valuation website`
  - `{industry} software platforms companies website funding series`
  - `established {industry} companies billion valuation website linkedin`
- Call: `client.search.create({ query: competitorQueries, max_results, return_snippets: true, country: 'US' })`
- Parsing: Extracts name/website/funding/valuation/employee count/stage/risk from titles/snippets with heuristics: kill-my-startup/src/app/api/competitors/route.ts:127

Caching
- Stored via `CompetitorCache` in Prisma (TTL ~12h).
- On cache hit (unless `forceRefresh`), returns cached competitors fast.

Value
- Zero-setup competitor discovery per industry/context.
- Normalized fields for downstream analytics and dashboards.
- Cached to minimize search cost and API latency.

News/Search API
- File: kill-my-startup/src/app/api/search/route.ts:1
- Purpose: Pull current news using Perplexity, personalized to the user’s profile and their competitors. Tag items and compute a textual analysis summary.

Endpoints
- POST `/api/search`
- Body: `{ max_results?: number, forceRefresh?: boolean }`
- Auth: uses Clerk (`auth()`); responds 401 if unauthenticated.
- Response fields:
  - `news`: array `{ title, url, date, snippet?, relevance, tag }`
  - `analysis`: string — synthesized summary with competitor mentions and recommendations
  - `total_results`, `fromCache`, `query`

Flow
- Loads the signed-in user’s profile from Prisma (startup name/description/industry/stage/market).
- Fetches top competitors via the Competitors API: kill-my-startup/src/app/api/search/route.ts:160
- Builds 5 Perplexity queries with profile + competitors: kill-my-startup/src/app/api/search/route.ts:187
- Calls Perplexity search and maps results to `NewsItem`.
- Determines `relevance` and `tag` with heuristics: kill-my-startup/src/app/api/search/route.ts:250
- Caches news (TTL ~6h) via `NewsCache`.

Value
- Personalized monitoring of market + competitor activity with minimal setup.
- Tags competitor mentions; provides an executive summary string for the dashboard.
- Controlled cost via caching and query limiting (Perplexity cap of 5 queries).

Social Media Analytics APIs
- Query metrics/mentions/tokens for a project (and optionally its competitors) from the DB.
- Files:
  - Query: kill-my-startup/src/app/api/social-media/query/route.ts:1
  - Ingest: kill-my-startup/src/app/api/social-media/ingest/route.ts:1

Query API
- GET `/api/social-media/query?projectId=...&days=7&includeCompetitors=true&timeWindow=DAY_7`
- Validates params with Zod.
- Joins competitor entities associated to the project.
- Returns:
  - Time-series metrics per hour: volume, positive, negative
  - Recent mentions (most recent 50), with entity mapping
  - Word cloud tokens aggregated by entity and time window
- Data source is Prisma (pre-ingested via the ingest route or another pipeline).

Ingest API
- POST `/api/social-media/ingest`
- Background job to compute hourly metrics, mentions, and word tokens.
- Designed to support multiple “strategies” (comments mention Perplexity-assisted link discovery, HN/PH/news mirrors, etc.). External credentials for X/Reddit would be needed in production — current design avoids direct paid API calls by relying on discovered public links.

Value
- Gives a dashboard view of conversation volume and sentiment for your project and tracked competitors.
- Flexible ingestion layer intended to be swapped with production-grade sources later.

Caching Layer
- CompetitorCache: stores normalized competitors by `(industry, context, userInfo)` with TTL ~12h.
- NewsCache: stores news lists by `(industry, userInfo, context)` with TTL ~6h.
- Both provide invalidate and cleanup helpers.
- Files: integrated within the API routes via their imports.

Known Issues / Limitations
- Perplexity API key is required. Missing key returns 500 with `{ error: 'Perplexity API key not configured' }` in both routes.
- Perplexity query limit of 5 per request → code enforces 5 queries; batching more topics requires multiple calls or scheduling.
- Heuristic parsing for competitor fields (name, website, valuation, funding, stage) can be noisy on ambiguous titles/snippets.
- Social media ingestion is scaffolded and may require paid credentials (X/Reddit) in production; current approach leans on discovered public links.
- Network latency and rate limits: add exponential backoff/retries if you see intermittent 429/5xx.
- Auth: `/api/search` expects a Clerk user session; unauthenticated calls fail with 401.
- Env/DB: ensure Prisma is migrated and `postinstall` runs `prisma generate`. See package.json scripts for DB helpers.

Next Steps
- Improve competitor parsing with LLM extraction passes (Perplexity Sonar) to reduce heuristics.
- Add deduplication and source trust scoring for news (prefer primary sources/PRs).
- Swap or extend social ingestion with official APIs where budgets allow; keep the Perplexity discovery fallback.
- Add background jobs/cron to pre-warm caches and keep news/competitors fresh.
- Extend search analysis to output structured insights (JSON) for richer dashboard widgets.

Quick Smoke Tests
- Competitors: `curl -X POST /api/competitors -d '{"industry":"AI research","context":"LLM copilot for scientists"}' -H 'content-type: application/json'`
- Search: `curl -X POST /api/search -d '{"max_results":10}' -H 'content-type: application/json'` (requires user session; use app UI)
- Social Query: `GET /api/social-media/query?projectId=<id>&days=7`

Check logs for “Perplexity API key not configured”, cache hits/misses, and Prisma errors when debugging.
