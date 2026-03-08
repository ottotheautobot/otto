import { NextRequest, NextResponse } from 'next/server'

const RESY_API_KEY = process.env.RESY_API_KEY!
const RESY_AUTH_TOKEN = process.env.RESY_AUTH_TOKEN!

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const date = searchParams.get('date') || '2026-03-17'
  const partySize = searchParams.get('party_size') || '2'
  const location = searchParams.get('location') || 'ny'

  const results: any[] = []

  // Test 1: Search all venues in location
  try {
    const url1 = `https://api.resy.com/3/search?location=${location}&date=${date}&covers=${partySize}`
    const res1 = await fetch(url1, {
      headers: {
        'Authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
        'x-resy-auth-token': RESY_AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
    })
    const body1 = await res1.text()
    results.push({
      name: '/3/search (location search)',
      url: url1,
      status: res1.status,
      contentType: res1.headers.get('content-type'),
      body: body1.substring(0, 500),
    })
  } catch (e) {
    results.push({ name: '/3/search', error: String(e) })
  }

  // Test 2: Collections with isAuth=true
  try {
    const url2 = `https://api.resy.com/3/collections?location_id=${location}&include_algo=1&isAuth=true`
    const res2 = await fetch(url2, {
      headers: {
        'Authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
        'x-resy-auth-token': RESY_AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
    })
    const body2 = await res2.text()
    results.push({
      name: '/3/collections (with isAuth=true)',
      url: url2,
      status: res2.status,
      contentType: res2.headers.get('content-type'),
      body: body2.substring(0, 500),
    })
  } catch (e) {
    results.push({ name: '/3/collections', error: String(e) })
  }

  // Test 3: Search with specific venue
  try {
    const url3 = `https://api.resy.com/3/search?location=${location}&date=${date}&covers=${partySize}&venue_id=68244`
    const res3 = await fetch(url3, {
      headers: {
        'Authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
        'x-resy-auth-token': RESY_AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
    })
    const body3 = await res3.text()
    results.push({
      name: '/3/search with venue_id=68244',
      url: url3,
      status: res3.status,
      contentType: res3.headers.get('content-type'),
      body: body3.substring(0, 500),
    })
  } catch (e) {
    results.push({ name: '/3/search with venue', error: String(e) })
  }

  // Test 4: Try without lat/long and different query style
  try {
    const url4 = `https://api.resy.com/3/find?date=${date}&covers=${partySize}&venue_id=68244`
    const res4 = await fetch(url4, {
      headers: {
        'Authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
        'x-resy-auth-token': RESY_AUTH_TOKEN,
        'Content-Type': 'application/json',
      },
    })
    const body4 = await res4.text()
    results.push({
      name: '/3/find (no lat/long)',
      url: url4,
      status: res4.status,
      contentType: res4.headers.get('content-type'),
      body: body4.substring(0, 500),
    })
  } catch (e) {
    results.push({ name: '/3/find no lat/long', error: String(e) })
  }

  return NextResponse.json({
    testParams: { date, partySize, location },
    results,
  })
}
