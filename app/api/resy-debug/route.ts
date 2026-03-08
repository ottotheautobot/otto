import { NextRequest, NextResponse } from 'next/server'

const RESY_API_KEY = process.env.RESY_API_KEY!
const RESY_AUTH_TOKEN = process.env.RESY_AUTH_TOKEN!

interface TestResult {
  name: string
  method: string
  url: string
  headers: Record<string, string>
  status: number
  statusText: string
  contentType: string
  bodyPreview: string
  fullBody?: string
  error?: string
}

const results: TestResult[] = []

async function testEndpoint(
  name: string,
  url: string,
  headers: Record<string, string>
): Promise<TestResult> {
  try {
    console.log(`\n[TEST] ${name}`)
    console.log(`URL: ${url}`)
    console.log(`Headers:`, headers)

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    const contentType = response.headers.get('content-type') || 'unknown'
    const bodyText = await response.text()
    
    const result: TestResult = {
      name,
      method: 'GET',
      url,
      headers,
      status: response.status,
      statusText: response.statusText,
      contentType,
      bodyPreview: bodyText.substring(0, 200),
      fullBody: bodyText.length < 1000 ? bodyText : undefined,
    }

    console.log(`Status: ${response.status} ${response.statusText}`)
    console.log(`Content-Type: ${contentType}`)
    console.log(`Body preview: ${bodyText.substring(0, 100)}...`)

    results.push(result)
    return result
  } catch (error) {
    const result: TestResult = {
      name,
      method: 'GET',
      url,
      headers,
      status: 0,
      statusText: 'Error',
      contentType: 'error',
      bodyPreview: error instanceof Error ? error.message : String(error),
      error: error instanceof Error ? error.message : String(error),
    }
    results.push(result)
    return result
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const venueId = searchParams.get('venue_id') || '64593' // Torrisi
  const date = searchParams.get('date') || '2026-04-08'
  const partySize = searchParams.get('party_size') || '2'

  console.log(`\n=== RESY API DEBUG ===`)
  console.log(`API Key: ${RESY_API_KEY?.substring(0, 10)}...`)
  console.log(`Auth Token: ${RESY_AUTH_TOKEN?.substring(0, 20)}...`)
  console.log(`Testing with: venue=${venueId}, date=${date}, party_size=${partySize}`)

  // Test 1: Original endpoint with Bearer auth
  await testEndpoint(
    'Test 1: /3/venue/{id}/availability with Bearer',
    `https://api.resy.com/3/venue/${venueId}/availability?date=${date}&party_size=${partySize}`,
    {
      'authorization': `Bearer ${RESY_API_KEY}`,
      'x-resy-auth-token': RESY_AUTH_TOKEN,
      'Content-Type': 'application/json',
    }
  )

  // Test 2: /3/4/find endpoint with ResyAPI auth
  await testEndpoint(
    'Test 2: /3/4/find with ResyAPI auth header',
    `https://api.resy.com/3/4/find?lat=0&long=0&day=${date}&party_size=${partySize}&venue_id=${venueId}`,
    {
      'Authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
      'x-resy-auth-token': RESY_AUTH_TOKEN,
      'Content-Type': 'application/json',
    }
  )

  // Test 3: /3/4/find without Authorization header
  await testEndpoint(
    'Test 3: /3/4/find with only X-Resy-Auth-Token',
    `https://api.resy.com/3/4/find?lat=0&long=0&day=${date}&party_size=${partySize}&venue_id=${venueId}`,
    {
      'x-resy-auth-token': RESY_AUTH_TOKEN,
      'Content-Type': 'application/json',
    }
  )

  // Test 4: /3/4/find with just API key in header
  await testEndpoint(
    'Test 4: /3/4/find with ResyAPI auth but no token',
    `https://api.resy.com/3/4/find?lat=0&long=0&day=${date}&party_size=${partySize}&venue_id=${venueId}`,
    {
      'Authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
      'Content-Type': 'application/json',
    }
  )

  // Test 5: /2/config endpoint (from Alkaar bot)
  await testEndpoint(
    'Test 5: /2/config endpoint',
    `https://api.resy.com/2/config?venue_id=${venueId}`,
    {
      'Authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
      'x-resy-auth-token': RESY_AUTH_TOKEN,
      'Content-Type': 'application/json',
    }
  )

  // Test 6: /3/venue endpoint
  await testEndpoint(
    'Test 6: /3/venue endpoint',
    `https://api.resy.com/3/venue/${venueId}`,
    {
      'Authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
      'x-resy-auth-token': RESY_AUTH_TOKEN,
      'Content-Type': 'application/json',
    }
  )

  // Test 7: /3/find endpoint (with 0,0)
  await testEndpoint(
    'Test 7: /3/find with lat=0, long=0',
    `https://api.resy.com/3/find?lat=0&long=0&day=${date}&party_size=${partySize}&venue_id=${venueId}`,
    {
      'Authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
      'x-resy-auth-token': RESY_AUTH_TOKEN,
      'Content-Type': 'application/json',
    }
  )

  // Test 8: /3/find with NYC coordinates
  await testEndpoint(
    'Test 8: /3/find with NYC coords (40.7128, -74.0060)',
    `https://api.resy.com/3/find?lat=40.7128&long=-74.0060&day=${date}&party_size=${partySize}&venue_id=${venueId}`,
    {
      'Authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
      'x-resy-auth-token': RESY_AUTH_TOKEN,
      'Content-Type': 'application/json',
    }
  )

  // Test 9: /3/find without lat/long
  await testEndpoint(
    'Test 9: /3/find WITHOUT lat/long params',
    `https://api.resy.com/3/find?day=${date}&party_size=${partySize}&venue_id=${venueId}`,
    {
      'Authorization': `ResyAPI api_key="${RESY_API_KEY}"`,
      'x-resy-auth-token': RESY_AUTH_TOKEN,
      'Content-Type': 'application/json',
    }
  )

  return NextResponse.json({
    credentials: {
      apiKeyLength: RESY_API_KEY?.length,
      tokenLength: RESY_AUTH_TOKEN?.length,
    },
    testParams: { venueId, date, partySize },
    results,
    totalTests: results.length,
    successCount: results.filter(r => r.status === 200).length,
  })
}
