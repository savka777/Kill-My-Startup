const { PrismaClient } = require('@prisma/client')

async function cleanupOldTables() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🧹 Starting cleanup of old competitor tables...\n')
    
    // Check current record counts
    const competitorCount = await prisma.competitor.count()
    const competitorCacheCount = await prisma.competitorCache.count()
    const projectCompetitorCount = await prisma.projectCompetitor.count()
    const competitorProfileCount = await prisma.competitorProfile.count()
    
    console.log('📊 Current record counts:')
    console.log(`  - Competitor: ${competitorCount}`)
    console.log(`  - CompetitorCache: ${competitorCacheCount}`)
    console.log(`  - ProjectCompetitor: ${projectCompetitorCount}`)
    console.log(`  - CompetitorProfile: ${competitorProfileCount}`)
    
    if (competitorCount === 0 && competitorCacheCount === 0 && projectCompetitorCount === 0) {
      console.log('✅ All old tables are already empty. No cleanup needed.')
      return
    }
    
    // Delete records from old tables
    console.log('\n🗑️  Deleting records from old tables...')
    
    if (projectCompetitorCount > 0) {
      await prisma.projectCompetitor.deleteMany()
      console.log(`✅ Deleted ${projectCompetitorCount} ProjectCompetitor records`)
    }
    
    if (competitorCacheCount > 0) {
      await prisma.competitorCache.deleteMany()
      console.log(`✅ Deleted ${competitorCacheCount} CompetitorCache records`)
    }
    
    if (competitorCount > 0) {
      await prisma.competitor.deleteMany()
      console.log(`✅ Deleted ${competitorCount} Competitor records`)
    }
    
    // Verify final counts
    const finalCompetitorCount = await prisma.competitor.count()
    const finalCompetitorCacheCount = await prisma.competitorCache.count()
    const finalProjectCompetitorCount = await prisma.projectCompetitor.count()
    const finalCompetitorProfileCount = await prisma.competitorProfile.count()
    
    console.log('\n📈 Final record counts:')
    console.log(`  - Competitor: ${finalCompetitorCount}`)
    console.log(`  - CompetitorCache: ${finalCompetitorCacheCount}`)
    console.log(`  - ProjectCompetitor: ${finalProjectCompetitorCount}`)
    console.log(`  - CompetitorProfile: ${finalCompetitorProfileCount}`)
    
    console.log('\n✅ Cleanup completed successfully!')
    console.log('🎯 All competitor data is now consolidated in CompetitorProfile table.')
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupOldTables()