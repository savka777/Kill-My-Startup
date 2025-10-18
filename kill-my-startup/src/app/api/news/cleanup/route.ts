import { NextRequest, NextResponse } from 'next/server'
import { NewsCache } from '@/lib/news-cache'

export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal request (you might want to add auth)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.INTERNAL_API_TOKEN || 'cleanup-token'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Run cleanup
    await NewsCache.cleanupExpiredCache()
    
    // Get stats after cleanup
    const stats = await NewsCache.getCacheStats()
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleanup completed',
      stats
    })

  } catch (error) {
    console.error('Cleanup API error:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get cache statistics
    const stats = await NewsCache.getCacheStats()
    
    return NextResponse.json({
      success: true,
      stats
    })

  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to get stats', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}