// Simple script to update database with new schema
const { execSync } = require('child_process');

try {
  console.log('🔄 Updating database schema...');
  
  // Use db:push to sync schema without migrations
  execSync('pnpm run db:push', { stdio: 'inherit' });
  
  console.log('✅ Database schema updated successfully!');
  console.log('🔄 Generating Prisma client...');
  
  // Generate client
  execSync('pnpm run db:generate', { stdio: 'inherit' });
  
  console.log('✅ Prisma client generated successfully!');
  console.log('🎉 Database is ready with news and competitor caching!');
  
} catch (error) {
  console.error('❌ Error updating database:', error.message);
  console.log('\n💡 Manual steps:');
  console.log('1. Run: pnpm run db:push');
  console.log('2. Run: pnpm run db:generate');
  console.log('3. Restart your dev server');
}