import { NextRequest, NextResponse } from 'next/server'

const RESY_API_KEY = process.env.RESY_API_KEY!
const RESY_AUTH_TOKEN = process.env.RESY_AUTH_TOKEN!

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ venues: [] })
    }

    // Direct Resy API search
    const response = await fetch(
      `https://api.resy.com/3/find?query=${encodeURIComponent(query)}&location=new%20york`,
      {
        method: 'GET',
        headers: {
          'authorization': `Bearer ${RESY_API_KEY}`,
          'x-resy-auth-token': RESY_AUTH_TOKEN,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      }
    )

    if (!response.ok) {
      console.error(`Resy search HTTP ${response.status}:`, await response.text())
      return NextResponse.json({ venues: [] })
    }

    const data = await response.json()
    const venues = (data.results?.venues || [])
      .slice(0, 8) // Limit to 8 results
      .map((v: any) => ({
        id: v.id?.toString() || v.id,
        name: v.name,
        location: v.location?.name || 'New York',
        estimatedReleasePattern: 'daily',
        estimatedReleaseTime: '10:00',
        estimatedAdvanceDays: 30,
      }))

    return NextResponse.json({ venues })
  } catch (error) {
    console.error('Resy search error:', error)
    return NextResponse.json({ venues: [], error: error instanceof Error ? error.message : 'Search unavailable' })
  }
}
