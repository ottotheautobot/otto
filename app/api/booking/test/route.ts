import { NextRequest, NextResponse } from 'next/server'
import { runBookingScheduler } from '@/lib/booking-scheduler'

/**
 * TEST ENDPOINT - Manually trigger booking scheduler
 * Used for testing without waiting for cron
 * Only available in development or with auth token
 */
export async function POST(req: NextRequest) {
  try {
    console.log('Manual booking test triggered at', new Date().toISOString())
    
    const attempts = await runBookingScheduler()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      attempts,
      message: `Booking scheduler ran. ${attempts.length} attempts made.`,
    })
  } catch (error) {
    console.error('Test booking error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also allow GET for easier testing
export async function GET(req: NextRequest) {
  return POST(req)
}
