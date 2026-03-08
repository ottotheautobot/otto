import { NextRequest, NextResponse } from 'next/server'
import { runBookingScheduler } from '@/lib/booking-scheduler'

export async function POST(req: NextRequest) {
  try {
    const attempts = await runBookingScheduler()

    return NextResponse.json({
      success: true,
      attempts,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Booking run error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET for testing/manual trigger
export async function GET(req: NextRequest) {
  return POST(req)
}
