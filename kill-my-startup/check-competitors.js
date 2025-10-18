const { PrismaClient } = require('@prisma/client')

async function checkCompetitors() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking Competitor Database...\n')
    
    // Get recent competitors
    const competitors = await prisma.competitorProfile.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`📊 Total CompetitorProfile records: ${competitors.length}`)
    
    if (competitors.length > 0) {
      console.log('\n🏢 Recent Competitors:')
      competitors.forEach((comp, index) => {
        console.log(`  ${index + 1}. ${comp.name}`)
        console.log(`     Industry: ${comp.industry}`)
        console.log(`     Risk Level: ${comp.riskLevel}`)
        console.log(`     Description: ${comp.description?.substring(0, 60)}...`)
        console.log(`     Website: ${comp.website || 'N/A'}`)
        console.log(`     Created: ${comp.createdAt}`)
        console.log('')
      })
    }
    
    // Check by industry
    const industryBreakdown = await prisma.competitorProfile.groupBy({
      by: ['industry'],
      _count: {
        industry: true
      }
    })
    
    console.log('📈 Industry Breakdown:')
    industryBreakdown.forEach(industry => {
      console.log(`  - ${industry.industry}: ${industry._count.industry} competitors`)
    })
    
  } catch (error) {
    console.error('❌ Error checking competitors:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCompetitors()
