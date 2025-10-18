# Revenue API Documentation

## Overview
This API endpoint fetches competitor revenue data using the Perplexity Search API. It queries revenue information for specified companies and returns structured data with sources.

## Endpoint
`/api/revenue`

## Methods

### GET `/api/revenue`
Fetches revenue data for the top 5 mock competitors.

#### Mock Companies
- Stripe
- Shopify
- Square
- Adyen
- PayPal

#### Response
```json
{
  "success": true,
  "data": [
    {
      "company": "Stripe",
      "revenue": "Revenue information from Perplexity",
      "source": "https://source-url.com"
    }
  ],
  "timestamp": "2025-10-17T21:57:24.988Z"
}
```

#### Example
```bash
curl http://localhost:3000/api/revenue
```

---

### POST `/api/revenue`
Fetches revenue data for custom companies.

#### Request Body
```json
{
  "companies": ["Company A", "Company B", "Company C"]
}
```

#### Constraints
- Maximum 10 companies per request
- Companies must be provided as an array of strings

#### Response
```json
{
  "success": true,
  "data": [
    {
      "company": "Company A",
      "revenue": "Revenue information from Perplexity",
      "source": "https://source-url.com"
    },
    {
      "company": "Company B",
      "revenue": null,
      "source": null,
      "error": "Error message if failed"
    }
  ],
  "timestamp": "2025-10-17T21:57:24.988Z"
}
```

#### Example
```bash
curl -X POST http://localhost:3000/api/revenue \
  -H "Content-Type: application/json" \
  -d '{"companies": ["Tesla", "SpaceX", "Apple"]}'
```

---

## Setup

### 1. Environment Variables
Create a `.env.local` file in the root directory:

```bash
PERPLEXITY_API_KEY=your-perplexity-api-key-here
```

### 2. Get Perplexity API Key
1. Visit [Perplexity AI API](https://www.perplexity.ai/)
2. Sign up or log in
3. Navigate to API settings
4. Generate an API key
5. Add it to your `.env.local` file

### 3. Start the Development Server
```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/revenue`

---

## Error Handling

### API Key Not Configured
```json
{
  "company": "Company Name",
  "revenue": null,
  "source": null,
  "error": "Perplexity API key not configured"
}
```

### Invalid Request (POST)
```json
{
  "success": false,
  "error": "Please provide an array of company names in the request body"
}
```

### Too Many Companies (POST)
```json
{
  "success": false,
  "error": "Maximum 10 companies allowed per request"
}
```

### Server Error
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Implementation Details

### Perplexity Search API
The API uses Perplexity's `/search` endpoint with the following configuration:
- **Method**: POST
- **Endpoint**: `https://api.perplexity.ai/search`
- **Authentication**: Bearer token
- **Query Format**: "What is the latest annual revenue of {company}? Provide the specific revenue figure with the year."
- **Max Results**: 5

### Parallel Processing
All company revenue queries are executed in parallel using `Promise.all()` for optimal performance.

### Response Structure
Each company result includes:
- `company`: Company name
- `revenue`: Revenue information from Perplexity (or null if not found)
- `source`: Citation URL from Perplexity (or null if not available)
- `error`: Error message (only present if an error occurred)

---

## Next Steps

### Integration with Revenue Block
To integrate this API with the revenue block component:

1. Create a new component: `src/components/dashboard/RevenueBlock.tsx`
2. Use `fetch` or a data-fetching library to call `/api/revenue`
3. Display the revenue data in the dashboard
4. Add loading states and error handling
5. Replace the mock data in `src/app/dashboard/page.tsx`

### Example Integration
```tsx
'use client';

import { useEffect, useState } from 'react';

interface CompetitorRevenue {
  company: string;
  revenue: string | null;
  source: string | null;
  error?: string;
}

export default function RevenueBlock() {
  const [data, setData] = useState<CompetitorRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/revenue')
      .then(res => res.json())
      .then(result => {
        setData(result.data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading revenue data...</div>;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <h2 className="text-base font-medium">Competitor Revenue</h2>
      <div className="mt-4 space-y-3">
        {data.map((item) => (
          <div key={item.company}>
            <h3>{item.company}</h3>
            <p>{item.revenue || 'Data not available'}</p>
            {item.source && (
              <a href={item.source} target="_blank" rel="noopener noreferrer">
                Source
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```
