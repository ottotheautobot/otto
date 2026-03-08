import { NextRequest, NextResponse } from 'next/server'
import { ResyClient } from '@/lib/resy-client'

const RESY_API_KEY = process.env.RESY_API_KEY!
const RESY_AUTH_TOKEN = process.env.RESY_AUTH_TOKEN!

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')
    const location = searchParams.get('location') || 'New York'

    if (!query) {
      return NextResponse.json(
        { error: 'q (query) required' },
        { status: 400 }
      )
    }

    const resy = new ResyClient(RESY_API_KEY, RESY_AUTH_TOKEN)
    const venues = await resy.searchVenues(query, location)

    // Enrich with details (release pattern detection will be on frontend)
    const enriched = venues.map((v) => ({
      ...v,
      // Release pattern detection: most NYC restaurants do 30 days daily at 10am
      // This is a default; frontend can show options
      estimatedReleasePattern: 'daily',
      estimatedReleaseTime: '10:00',
      estimatedAdvanceDays: 30,
    }))

    return NextResponse.json({ venues: enriched })
  } catch (error) {
    console.error('Resy search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    )
  }
}
