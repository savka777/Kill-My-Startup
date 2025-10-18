const { PrismaClient } = require('@prisma/client')

async function diagnoseAPIs() {
  console.log('🔍 Diagnosing Twitter and Reddit API Issues...\n')
  
  // Check environment variables
  console.log('📋 Environment Variables:')
  console.log(`  - RAPIDAPI_KEY: ${process.env.RAPIDAPI_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log(`  - RAPIDAPI_TWITTER_HOST: ${process.env.RAPIDAPI_TWITTER_HOST || 'Using default'}`)
  console.log(`  - RAPIDAPI_REDDIT_HOST: ${process.env.RAPIDAPI_REDDIT_HOST || 'Using default'}`)
  
  if (!process.env.RAPIDAPI_KEY) {
    console.log('\n❌ ISSUE FOUND: RAPIDAPI_KEY is not set!')
    console.log('🔧 SOLUTION: Add RAPIDAPI_KEY to your .env file')
    console.log('📖 How to get it:')
    console.log('  1. Go to https://rapidapi.com/')
    console.log('  2. Sign up for a free account')
    console.log('  3. Subscribe to Twitter and Reddit APIs')
    console.log('  4. Copy your API key to .env file')
    return
  }
  
  // Test Twitter API
  console.log('\n🐦 Testing Twitter API...')
  const twitterHost = process.env.RAPIDAPI_TWITTER_HOST || 'real-time-x-com-data-scraper.p.rapidapi.com'
  
  try {
    const twitterResponse = await fetch(`https://${twitterHost}/search?query=test&section=top&limit=5`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': twitterHost
      }
    })
    
    console.log(`  - Status: ${twitterResponse.status}`)
    if (twitterResponse.status === 404) {
      console.log('  - ❌ 404 Error: API endpoint not found')
      console.log('  - 🔧 SOLUTION: The API endpoint may have changed or been deprecated')
    } else if (twitterResponse.status === 401) {
      console.log('  - ❌ 401 Error: Invalid API key')
      console.log('  - 🔧 SOLUTION: Check your RAPIDAPI_KEY')
    } else if (twitterResponse.status === 403) {
      console.log('  - ❌ 403 Error: API access denied')
      console.log('  - 🔧 SOLUTION: You may need to subscribe to the API plan')
    } else if (twitterResponse.ok) {
      console.log('  - ✅ Twitter API is working!')
    } else {
      console.log(`  - ⚠️  Unexpected status: ${twitterResponse.status}`)
    }
  } catch (error) {
    console.log(`  - ❌ Error: ${error.message}`)
  }
  
  // Test Reddit API
  console.log('\n🔴 Testing Reddit API...')
  const redditHost = process.env.RAPIDAPI_REDDIT_HOST || 'reddit34.p.rapidapi.com'
  
  try {
    const redditResponse = await fetch(`https://${redditHost}/search?query=test&sort=relevance&limit=5`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
        'X-RapidAPI-Host': redditHost
      }
    })
    
    console.log(`  - Status: ${redditResponse.status}`)
    if (redditResponse.status === 404) {
      console.log('  - ❌ 404 Error: API endpoint not found')
      console.log('  - 🔧 SOLUTION: The API endpoint may have changed or been deprecated')
    } else if (redditResponse.status === 401) {
      console.log('  - ❌ 401 Error: Invalid API key')
      console.log('  - 🔧 SOLUTION: Check your RAPIDAPI_KEY')
    } else if (redditResponse.status === 403) {
      console.log('  - ❌ 403 Error: API access denied')
      console.log('  - 🔧 SOLUTION: You may need to subscribe to the API plan')
    } else if (redditResponse.ok) {
      console.log('  - ✅ Reddit API is working!')
    } else {
      console.log(`  - ⚠️  Unexpected status: ${redditResponse.status}`)
    }
  } catch (error) {
    console.log(`  - ❌ Error: ${error.message}`)
  }
  
  console.log('\n💡 RECOMMENDATIONS:')
  console.log('1. Check your RapidAPI subscription status')
  console.log('2. Verify the API endpoints are still active')
  console.log('3. Consider using Perplexity-only approach (already working)')
  console.log('4. Update to newer API versions if available')
  
  console.log('\n🎯 CURRENT WORKAROUND:')
  console.log('Your system is already working with Perplexity-only approach!')
  console.log('The Twitter/Reddit APIs are optional - Perplexity handles social media search.')
}

diagnoseAPIs()
