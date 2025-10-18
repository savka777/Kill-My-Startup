# Environment Variables Setup

This document outlines the required environment variables for the "People Talking About" dashboard component.

## Required Environment Variables

### Database
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/kill_my_startup"
```

### Perplexity AI API
```bash
PERPLEXITY_API_KEY="your_perplexity_api_key_here"
```
- **Purpose**: Used for Perplexity Search and Sonar APIs for content discovery and sentiment analysis
- **How to get**: Sign up at [Perplexity AI](https://www.perplexity.ai/) and get your API key
- **Usage**: Powers the three search strategies for conversation tracking

### RapidAPI (for Twitter and Reddit)
```bash
RAPIDAPI_KEY="your_rapidapi_key_here"
RAPIDAPI_TWITTER_HOST="twitter-api-v2.p.rapidapi.com"
RAPIDAPI_REDDIT_HOST="reddit-data1.p.rapidapi.com"
```
- **Purpose**: Used for fetching Twitter and Reddit mentions via RapidAPI
- **How to get**: Sign up at [RapidAPI](https://rapidapi.com/) and subscribe to Twitter/Reddit APIs
- **Usage**: Strategy 1 - Direct API calls for Twitter and Reddit data

## Optional Environment Variables

### Product Hunt API
```bash
PRODUCT_HUNT_TOKEN="your_product_hunt_token_here"
```
- **Purpose**: Direct API access to Product Hunt data
- **How to get**: Create a Product Hunt account and generate API token
- **Usage**: Enhanced Product Hunt data collection

### Job Search APIs
```bash
JSEARCH_KEY="your_jsearch_key_here"
GREENHOUSE_BOARD_URL="your_greenhouse_board_url_here"
```
- **Purpose**: Enhanced hiring signal detection
- **How to get**: Sign up for JSearch and Greenhouse APIs
- **Usage**: Job posting monitoring for competitor analysis

## Setup Instructions

1. **Copy the environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your API keys**:
   - Get a Perplexity API key from [Perplexity AI](https://www.perplexity.ai/)
   - Get a RapidAPI key from [RapidAPI](https://rapidapi.com/)
   - Set up your database connection string

3. **Test the configuration**:
   ```bash
   npm run dev
   ```

## API Rate Limits and Costs

### Perplexity AI
- **Free tier**: Limited requests per month
- **Paid tier**: Higher rate limits and better performance
- **Recommendation**: Start with free tier for testing

### RapidAPI
- **Pricing**: Varies by API provider
- **Twitter API**: Usually has free tier with limited requests
- **Reddit API**: Often free with reasonable limits
- **Recommendation**: Check individual API pricing on RapidAPI

## Testing Without API Keys

The system includes fallback mechanisms:
- **Sentiment Analysis**: Falls back to rule-based analysis if Perplexity is unavailable
- **Data Sources**: Uses seed data for testing without real API calls
- **Development**: Run the seed script to populate test data

## Production Considerations

1. **Rate Limiting**: Implement proper rate limiting for API calls
2. **Error Handling**: All API calls include error handling and fallbacks
3. **Monitoring**: Set up monitoring for API usage and costs
4. **Caching**: Consider caching frequently accessed data
5. **Security**: Never commit API keys to version control

## Troubleshooting

### Common Issues

1. **"API key not found" warnings**: Check your environment variables are properly set
2. **Rate limit exceeded**: Implement exponential backoff or upgrade API plans
3. **No data appearing**: Run the seed script to populate test data
4. **Database connection issues**: Verify your DATABASE_URL is correct

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will show detailed logs of API calls and data processing.
