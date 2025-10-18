import { NextResponse } from 'next/server'
import { CompetitorScheduler } from '@/lib/competitor-scheduler'

export async function GET() {
  try {
    const schedulingStatus = await CompetitorScheduler.getSchedulingStatus()
    
    return NextResponse.json({
      success: true,
      schedule: schedulingStatus,
      config: {
        discoveryIntervalHours: 24,
        parameterUpdateIntervalHours: 2,
        description: "Discovery runs daily with sonar-pro, parameter updates every 2 hours with sonar"
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting scheduling status:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


