const { PrismaClient } = require('@prisma/client')

async function testSocialMediaIntegration() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing Social Media Integration...\n')
    
    // Check if there are any projects
    const projects = await prisma.project.findMany({
      take: 3,
      select: { id: true, name: true, keywords: true }
    })
    
    console.log('📊 Found projects:', projects.length)
    projects.forEach(p => {
      console.log(`  - ${p.name} (${p.id})`)
      console.log(`    Keywords: ${p.keywords.join(', ')}`)
    })
    
    if (projects.length === 0) {
      console.log('❌ No projects found. Creating a test project...')
      
      const testProject = await prisma.project.create({
        data: {
          name: 'Test Social Media Project',
          description: 'Testing social media integration',
          keywords: ['AI', 'education', 'startup', 'test']
        }
      })
      
      console.log(`✅ Created test project: ${testProject.name} (${testProject.id})`)
      projects.push(testProject)
    }
    
    // Check if there are any competitors
    const competitors = await prisma.competitorProfile.findMany({
      take: 5,
      select: { id: true, name: true, industry: true, riskLevel: true }
    })
    
    console.log('\n🏢 Found competitors:', competitors.length)
    competitors.forEach(c => {
      console.log(`  - ${c.name} (${c.industry}) - Risk: ${c.riskLevel}`)
    })
    
    if (competitors.length === 0) {
      console.log('❌ No competitors found. Creating test competitors...')
      
      const testCompetitors = await Promise.all([
        prisma.competitorProfile.create({
          data: {
            name: 'Test Competitor 1',
            industry: 'AI/education',
            description: 'AI education platform',
            riskLevel: 'HIGH',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        }),
        prisma.competitorProfile.create({
          data: {
            name: 'Test Competitor 2',
            industry: 'AI/education',
            description: 'Educational AI startup',
            riskLevel: 'MEDIUM',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        })
      ])
      
      console.log(`✅ Created ${testCompetitors.length} test competitors`)
    }
    
    // Test the social media query with a real project
    const testProject = projects[0]
    console.log(`\n🧪 Testing social media query with project: ${testProject.name}`)
    
    const response = await fetch(`http://localhost:3000/api/social-media/query?projectId=${testProject.id}&days=7&includeCompetitors=true`)
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Social media query successful!')
      console.log(`  - Project: ${data.project?.name}`)
      console.log(`  - Entities found: ${data.entities?.length || 0}`)
      console.log(`  - Competitors included: ${data.entities?.filter(e => e.type === 'competitor').length || 0}`)
      console.log(`  - Recent mentions: ${data.recentMentions?.length || 0}`)
    } else {
      console.log('❌ Social media query failed:', data.error)
    }
    
  } catch (error) {
    console.error('❌ Error testing social media integration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSocialMediaIntegration()


