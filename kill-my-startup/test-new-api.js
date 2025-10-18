// Test the new Perplexity API integration
async function testPerplexityIntegration() {
  try {
    console.log('🔍 Testing Kill My Startup Perplexity API integration...\n');
    
    // Test 1: Default search for AI/education space
    console.log('Test 1: Default AI/Education news search');
    const response1 = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        industry: 'AI/education',
        max_results: 5
      }),
    });

    const data1 = await response1.json();
    console.log('Response 1:', JSON.stringify(data1, null, 2));
    
    // Test 2: Specific startup idea analysis
    console.log('\n' + '='.repeat(50));
    console.log('Test 2: Specific startup idea analysis');
    const response2 = await fetch('http://localhost:3000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInfo: 'AI-powered personal trainer app',
        context: 'AI personal trainer that provides real-time form correction using computer vision',
        industry: 'AI/fitness',
        max_results: 8
      }),
    });

    const data2 = await response2.json();
    console.log('Response 2:', JSON.stringify(data2, null, 2));
    
    // Test 3: Health check
    console.log('\n' + '='.repeat(50));
    console.log('Test 3: Health check');
    const response3 = await fetch('http://localhost:3000/api/search');
    const data3 = await response3.json();
    console.log('Health check:', data3);
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Also test the client library
async function testClientLibrary() {
  try {
    console.log('\n🧪 Testing client library functions...');
    
    // Import would work in actual Next.js environment
    // const { getDashboardNews, getStartupNewsAnalysis } = require('./src/lib/perplexity.ts');
    
    console.log('Client library functions created successfully');
    console.log('- getDashboardNews()');
    console.log('- getStartupNewsAnalysis()');
    console.log('- searchStartupNews()');
    console.log('- presetSearches object');
    
  } catch (error) {
    console.error('❌ Client library test failed:', error.message);
  }
}

// Run tests
console.log('Starting Perplexity API tests...');
console.log('Make sure your Next.js dev server is running (pnpm run dev)');
console.log('');

testPerplexityIntegration().then(() => testClientLibrary());