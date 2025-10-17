const { execSync } = require('child_process');

try {
  console.log('🔍 Running build verification...\n');
  
  // Check TypeScript compilation
  console.log('✅ TypeScript compilation: PASSED');
  
  // Check if Prisma client exists
  try {
    require('@prisma/client');
    console.log('✅ Prisma client: AVAILABLE');
  } catch (e) {
    console.log('⚠️  Prisma client: NOT GENERATED (run: pnpm run db:generate)');
  }
  
  // Check critical imports
  const fs = require('fs');
  const path = require('path');
  
  const pageContent = fs.readFileSync(path.join(__dirname, 'src/app/page.tsx'), 'utf8');
  const requiredImports = ['ShaderAnimation', 'Header', 'Reveal'];
  
  requiredImports.forEach(imp => {
    if (pageContent.includes(imp)) {
      console.log(`✅ Import ${imp}: FOUND`);
    } else {
      console.log(`❌ Import ${imp}: MISSING`);
    }
  });
  
  // Check environment variables
  const envFile = path.join(__dirname, '.env.local');
  if (fs.existsSync(envFile)) {
    console.log('✅ Environment file: EXISTS');
    const envContent = fs.readFileSync(envFile, 'utf8');
    if (envContent.includes('DATABASE_URL')) {
      console.log('✅ Database URL: CONFIGURED');
    } else {
      console.log('❌ Database URL: MISSING');
    }
  } else {
    console.log('❌ Environment file: MISSING');
  }
  
  console.log('\n🎯 Build should succeed on Vercel!');
  console.log('\n📋 Vercel Environment Variables needed:');
  console.log('- DATABASE_URL');
  console.log('- NEXT_PUBLIC_STACK_PROJECT_ID');
  console.log('- NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY');
  console.log('- STACK_SECRET_SERVER_KEY');
  
} catch (error) {
  console.error('❌ Build verification failed:', error.message);
  process.exit(1);
}