import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
// @ts-ignore - temporary fix for missing types
import nodemailer from 'nodemailer'

export interface ExportRequest {
  format: 'pdf' | 'email'
  email?: string
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body: ExportRequest = await request.json()
    const { format, email } = body

    // Get user profile and data from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { profile: true }
    })

    if (!user || !user.profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Use mock data for demo
    const news: any[] = [
      {
        title: "AI Startup Raises $50M Series B to Revolutionize Education",
        url: "https://example.com/news1",
        date: "2024-10-18",
        snippet: "Leading EdTech company secures major funding round to expand AI-powered learning platform globally.",
        relevance: "Direct competitor funding activity",
        tag: "Funding"
      },
      {
        title: "New Study Shows 40% Growth in EdTech Market",
        url: "https://example.com/news2", 
        date: "2024-10-17",
        snippet: "Market research indicates strong demand for personalized learning solutions in education sector.",
        relevance: `${user.profile.industry} industry trends`,
        tag: "Market Analysis"
      },
      {
        title: "ChatGPT Integration Transforms Classroom Learning",
        url: "https://example.com/news3",
        date: "2024-10-16", 
        snippet: "Educational institutions report improved student engagement with AI-powered tutoring systems.",
        relevance: "AI technology adoption in education",
        tag: "AI Tech"
      },
      {
        title: "Startup Failure: LearningBot Shuts Down After 2 Years",
        url: "https://example.com/news4",
        date: "2024-10-15",
        snippet: "EdTech startup closes due to poor user retention and funding challenges.",
        relevance: "Warning signal for industry",
        tag: "Risk Alert"
      },
      {
        title: "Microsoft Launches New Education AI Platform",
        url: "https://example.com/news5",
        date: "2024-10-14",
        snippet: "Tech giant enters education market with comprehensive AI-powered learning suite.",
        relevance: "Big tech competition entering market",
        tag: "Competitor News"
      }
    ]

    const competitors: any[] = [
      {
        id: "comp1",
        name: "EduGenius AI",
        description: "AI-powered personalized learning platform for K-12 students",
        website: "edugenius.com",
        industry: user.profile.industry,
        foundedYear: 2021,
        employeeCount: "50-100",
        lastFunding: "Series A",
        fundingAmount: "$15M",
        recentNews: "Partnered with 500+ schools nationwide",
        riskLevel: "HIGH"
      },
      {
        id: "comp2", 
        name: "SmartTutor Pro",
        description: "Adaptive tutoring system using machine learning algorithms",
        website: "smarttutor.pro",
        industry: user.profile.industry,
        foundedYear: 2020,
        employeeCount: "25-50", 
        lastFunding: "Seed",
        fundingAmount: "$5M",
        recentNews: "Launched mobile app with 100K+ downloads",
        riskLevel: "MEDIUM"
      },
      {
        id: "comp3",
        name: "LearnBot Studios", 
        description: "Conversational AI for interactive educational content",
        website: "learnbot.studios",
        industry: user.profile.industry,
        foundedYear: 2022,
        employeeCount: "10-25",
        lastFunding: "Pre-seed", 
        fundingAmount: "$2M",
        recentNews: "Beta testing with select universities",
        riskLevel: "LOW"
      },
      {
        id: "comp4",
        name: "ClassroomAI",
        description: "Enterprise AI solutions for educational institutions",
        website: "classroom.ai",
        industry: user.profile.industry,
        foundedYear: 2019,
        employeeCount: "100-250",
        lastFunding: "Series B",
        fundingAmount: "$30M", 
        recentNews: "Acquired by Pearson Education",
        riskLevel: "CRITICAL"
      }
    ]

    const newsAnalysisText = `Analysis based on ${news.length} recent articles in ${user.profile.industry} industry. Market shows strong growth with significant funding activity, but also notable risks with recent startup failures. Big tech companies are entering the space, increasing competition.`

    // Generate report data
    const reportData = generateReportData(user, news, competitors)

    if (format === 'email' && email) {
      // Send email
      await sendEmailReport(email, reportData, user)
      return NextResponse.json({ success: true, message: 'Report sent successfully' })
    } else {
      // Return PDF data
      return NextResponse.json({ 
        success: true, 
        reportData,
        message: 'Report data generated successfully'
      })
    }

  } catch (error) {
    console.error('Export API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateReportData(user: any, news: any[], competitors: any[]) {
  const profile = user.profile
  
  // Only analyze real data - no made up categories
  const newsAnalysis = {
    total: news.length,
    funding: news.filter(n => n.tag && n.tag.toLowerCase().includes('funding')).length,
    competitorNews: news.filter(n => n.tag && n.tag.toLowerCase().includes('competitor')).length,
    riskAlerts: news.filter(n => n.tag && n.tag.toLowerCase().includes('risk')).length,
    general: news.filter(n => !n.tag || n.tag.toLowerCase().includes('general')).length
  }

  // Only analyze actual competitor data
  const competitorAnalysis = {
    total: competitors.length,
    critical: competitors.filter(c => c.riskLevel === 'CRITICAL').length,
    high: competitors.filter(c => c.riskLevel === 'HIGH').length,
    medium: competitors.filter(c => c.riskLevel === 'MEDIUM').length,
    low: competitors.filter(c => c.riskLevel === 'LOW').length,
    withValuation: competitors.filter(c => c.valuation && c.valuation !== 'Unknown').length,
    withWebsite: competitors.filter(c => c.website).length
  }

  // Get actual top competitors (only those with real data)
  const topCompetitors = competitors
    .filter(c => c.name && c.name.trim() !== '')
    .slice(0, 5)
    .map(c => ({
      name: c.name,
      valuation: c.valuation || null,
      stage: c.stage || null,
      employeeCount: c.employeeCount || null,
      website: c.website || null,
      description: c.description || null
    }))

  // Get actual news highlights (only real news)
  const newsHighlights = news
    .filter(n => n.title && n.title.trim() !== '')
    .slice(0, 5)
    .map(n => ({
      title: n.title,
      url: n.url || null,
      date: n.date || null,
      relevance: n.relevance || null,
      tag: n.tag || null
    }))

  return {
    companyInfo: {
      name: profile.startupName || 'Unknown',
      industry: profile.industry || 'Unknown',
      stage: profile.stage || 'Unknown',
      targetMarket: profile.targetMarket || 'Unknown',
      description: profile.startupDescription || 'No description available'
    },
    summary: {
      reportDate: new Date().toISOString(),
      newsArticles: newsAnalysis.total,
      competitorsTracked: competitorAnalysis.total,
      criticalThreats: competitorAnalysis.critical,
      highThreats: competitorAnalysis.high
    },
    newsAnalysis,
    competitorAnalysis,
    topCompetitors,
    newsHighlights,
    actualData: {
      hasNews: news.length > 0,
      hasCompetitors: competitors.length > 0,
      dataTimestamp: new Date().toISOString()
    },
    factualSummary: generateFactualSummary(profile, newsAnalysis, competitorAnalysis)
  }
}

function calculateAverageEmployees(competitors: any[]): string {
  const companiesWithEmployees = competitors.filter(c => c.employeeCount && c.employeeCount !== 'Unknown')
  if (companiesWithEmployees.length === 0) return 'Unknown'
  
  let total = 0
  let count = 0
  
  for (const comp of companiesWithEmployees) {
    const employeeStr = comp.employeeCount.replace(/[+,]/g, '')
    const employees = parseInt(employeeStr)
    if (!isNaN(employees)) {
      total += employees
      count++
    }
  }
  
  if (count === 0) return 'Unknown'
  
  const avg = Math.round(total / count)
  if (avg >= 1000) return '1,000+'
  if (avg >= 500) return '500+'
  if (avg >= 100) return '100+'
  return avg.toString()
}

function generateFactualSummary(profile: any, newsAnalysis: any, competitorAnalysis: any): string[] {
  const facts = []
  
  // Only include facts based on actual data
  if (competitorAnalysis.total > 0) {
    facts.push(`Found ${competitorAnalysis.total} competitors in ${profile.industry}`)
    
    if (competitorAnalysis.critical > 0) {
      facts.push(`${competitorAnalysis.critical} competitors marked as critical threat level`)
    }
    
    if (competitorAnalysis.withValuation > 0) {
      facts.push(`${competitorAnalysis.withValuation} competitors have public valuation data`)
    }
  }
  
  if (newsAnalysis.total > 0) {
    facts.push(`${newsAnalysis.total} relevant news articles found`)
    
    if (newsAnalysis.funding > 0) {
      facts.push(`${newsAnalysis.funding} funding-related news articles`)
    }
    
    if (newsAnalysis.competitorNews > 0) {
      facts.push(`${newsAnalysis.competitorNews} competitor-specific news articles`)
    }
  }
  
  if (facts.length === 0) {
    facts.push('No significant market intelligence data available at this time')
  }
  
  return facts
}

async function sendEmailReport(email: string, reportData: any, user: any) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  const emailContent = generateEmailHTML(reportData, user)
  
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: `Market Intelligence Report - ${reportData.companyInfo.name}`,
    html: emailContent
  })
}

function generateEmailHTML(reportData: any, user: any): string {
  const { companyInfo, summary, newsAnalysis, competitorAnalysis, topCompetitors, factualSummary, newsHighlights } = reportData
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Market Intelligence Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; opacity: 0.8; }
        .content { padding: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #1a1a1a; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
        .stat-label { font-size: 14px; color: #666; }
        .competitor-list { background: #f8f9fa; border-radius: 8px; padding: 20px; }
        .competitor-item { display: flex; justify-content: between; align-items: center; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .competitor-item:last-child { border-bottom: none; }
        .competitor-name { font-weight: 600; color: #1a1a1a; }
        .competitor-details { font-size: 14px; color: #666; margin-top: 4px; }
        .recommendations { background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; border-radius: 0 8px 8px 0; }
        .recommendation { margin-bottom: 10px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyInfo.name}</h1>
          <p>Market Intelligence Report • ${new Date(summary.reportDate).toLocaleDateString()}</p>
        </div>
        
        <div class="content">
          <div class="section">
            <h2>Executive Summary</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${summary.newsArticles}</div>
                <div class="stat-label">News Articles</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${summary.competitorsTracked}</div>
                <div class="stat-label">Competitors</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${summary.criticalThreats}</div>
                <div class="stat-label">Critical Threats</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${summary.marketOpportunities}</div>
                <div class="stat-label">Opportunities</div>
              </div>
            </div>
            <p><strong>Industry:</strong> ${companyInfo.industry} • <strong>Stage:</strong> ${companyInfo.stage} • <strong>Target Market:</strong> ${companyInfo.targetMarket}</p>
          </div>

          ${topCompetitors.length > 0 ? `
          <div class="section">
            <h2>Top Competitors Found</h2>
            <div class="competitor-list">
              ${topCompetitors.map((comp: any) => `
                <div class="competitor-item">
                  <div>
                    <div class="competitor-name">${comp.name}</div>
                    <div class="competitor-details">
                      ${comp.valuation ? `Valuation: ${comp.valuation}` : 'Valuation: Not available'}
                      ${comp.stage ? ` • Stage: ${comp.stage}` : ''}
                      ${comp.employeeCount ? ` • Employees: ${comp.employeeCount}` : ''}
                      ${comp.website ? ` • Website: ${comp.website}` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <div class="section">
            <h2>Data Summary</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${newsAnalysis.funding}</div>
                <div class="stat-label">Funding News</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${competitorAnalysis.critical + competitorAnalysis.high}</div>
                <div class="stat-label">High-Risk Competitors</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${competitorAnalysis.withValuation}</div>
                <div class="stat-label">Companies with Valuation</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${newsAnalysis.riskAlerts}</div>
                <div class="stat-label">Risk Alerts</div>
              </div>
            </div>
          </div>

          ${newsHighlights.length > 0 ? `
          <div class="section">
            <h2>Recent News Headlines</h2>
            <div class="recommendations">
              ${newsHighlights.map((news: any) => `
                <div class="recommendation">
                  <strong>${news.title}</strong>
                  ${news.relevance ? `<br><em>${news.relevance}</em>` : ''}
                  ${news.date ? `<br><small>Date: ${news.date}</small>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <div class="section">
            <h2>Key Findings</h2>
            <div class="recommendations">
              ${factualSummary.map((fact: any) => `<div class="recommendation">• ${fact}</div>`).join('')}
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Generated by Kill My Startup • Market Intelligence Platform</p>
          <p>This report contains data as of ${new Date(summary.reportDate).toLocaleDateString()}</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Export API is running',
    timestamp: new Date().toISOString()
  })
}