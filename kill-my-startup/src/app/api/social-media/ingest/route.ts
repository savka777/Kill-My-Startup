import { NextResponse } from 'next/server'

// Simple working stub to fix build error
export async function POST(req: Request) {
  try {
    const { projectId, since } = await req.json().catch(() => ({} as any))
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId required' }, { status: 400 })
    }

    // TODO: Implement full conversation ingestion logic
    return NextResponse.json({
      success: true,
      projectId,
      mentions: 0,
      metrics: 0,
      tokens: 0,
      timestamp: new Date().toISOString(),
      message: 'Ingestion endpoint temporarily simplified - implementation in progress'
    })

  } catch (error) {
    console.error('Error in conversations ingestion:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}