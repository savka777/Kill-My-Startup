const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Test creating tables
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS startup_submissions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        email TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'PENDING'
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS feedback (
        id TEXT PRIMARY KEY,
        "submissionId" TEXT NOT NULL,
        "reviewerName" TEXT,
        feedback TEXT NOT NULL,
        rating INTEGER NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("submissionId") REFERENCES startup_submissions(id) ON DELETE CASCADE
      );
    `
    
    console.log('✅ Tables created successfully!')
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()