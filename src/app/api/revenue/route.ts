import { NextResponse } from 'next/server';

// Mock companies for testing
const MOCK_COMPANIES = [
  'Stripe',
  'Shopify',
  'Square',
  'Adyen',
  'PayPal'
];

interface CompetitorRevenue {
  company: string;
  revenue: string | null;
  source: string | null;
  error?: string;
}

interface PerplexityChatResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }>;
  search_results?: Array<{
    title: string;
    url: string;
    date?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

async function searchCompanyRevenue(company: string): Promise<CompetitorRevenue> {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return {
      company,
      revenue: null,
      source: null,
      error: 'Perplexity API key not configured'
    };
  }

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You must respond with ONLY the revenue amount and year in this exact format: "$X.XX billion (YYYY)" or "$XXX million (YYYY)". No additional text, explanations, or context. Just the number and year.'
          },
          {
            role: 'user',
            content: `What is ${company}'s latest annual revenue?`
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
    }

    const data: PerplexityChatResponse = await response.json();

    const answer = data.choices?.[0]?.message?.content || null;
    const source = data.search_results?.[0]?.url || null;

    return {
      company,
      revenue: answer,
      source: source,
    };
  } catch (error) {
    console.error(`Error fetching revenue for ${company}:`, error);
    return {
      company,
      revenue: null,
      source: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET() {
  try {
    // Fetch revenue data for all mock companies in parallel
    const revenuePromises = MOCK_COMPANIES.map(company => searchCompanyRevenue(company));
    const revenues = await Promise.all(revenuePromises);

    return NextResponse.json({
      success: true,
      data: revenues,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in revenue API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companies } = body;

    if (!companies || !Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide an array of company names in the request body',
        },
        { status: 400 }
      );
    }

    if (companies.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum 10 companies allowed per request',
        },
        { status: 400 }
      );
    }

    // Fetch revenue data for provided companies
    const revenuePromises = companies.map(company => searchCompanyRevenue(company));
    const revenues = await Promise.all(revenuePromises);

    return NextResponse.json({
      success: true,
      data: revenues,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in revenue API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
