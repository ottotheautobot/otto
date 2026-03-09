import { chromium } from 'playwright'
import fs from 'fs'

const RESY_API_KEY = process.env.RESY_API_KEY || 'VbWk7s3L4KiK5fzlO7JD3Q5EYolJI7n5'
const RESY_AUTH_TOKEN =
  process.env.RESY_AUTH_TOKEN ||
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NzY4OTg5MzksInVpZCI6MjAzNjU5NSwiZ3QiOiJjb25zdW1lciIsImdzIjpbXSwibGFuZyI6ImVuLXVzIiwiZXh0cmEiOnsiZ3Vlc3RfaWQiOjEzMDU3NjA2fX0.AN9N9PGUJoHBP155UPnGKw7h2KdLJrvoYwreWkZGDHMoSBouhYhUriftRGmQw40wQTxoWTG4sptoTq0DhNGIKedvAaI1q1P0rbpXmFKTvQkVTC5gaYF3xHnM4-6HN9InV405p-h21oLO0dHBmniqvN8uOWPGU3A2R5_SGUyQ41xePqZ_'

interface NetworkLog {
  timestamp: number
  method: string
  url: string
  requestHeaders: Record<string, string>
  requestBody?: string
  responseStatus: number
  responseHeaders: Record<string, string>
  responseBody: string
}

const logs: NetworkLog[] = []

async function investigate() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  // Log all network requests
  page.on('response', async (response) => {
    if (!response.url().includes('api.resy.com')) return

    const url = response.url()
    const status = response.status()

    let body = ''
    try {
      body = await response.text()
    } catch (e) {
      body = '[Could not read body]'
    }

    const log: NetworkLog = {
      timestamp: Date.now(),
      method: response.request().method(),
      url,
      requestHeaders: response.request().headers(),
      requestBody: response.request().postDataJSON() ? JSON.stringify(response.request().postDataJSON()) : undefined,
      responseStatus: status,
      responseHeaders: response.headers(),
      responseBody: body.substring(0, 2000), // First 2000 chars
    }

    logs.push(log)
    console.log(`\n📡 ${response.request().method()} ${url}`)
    console.log(`   Status: ${status}`)
    if (log.requestBody) console.log(`   Request: ${log.requestBody.substring(0, 200)}...`)
    console.log(`   Response: ${body.substring(0, 100)}...`)
  })

  try {
    console.log('🚀 Navigating to HolyWater venue page...')
    await page.goto('https://resy.com/cities/new-york-ny/venues/holywater?date=2026-03-17', {
      waitUntil: 'networkidle',
    })

    console.log('\n⏳ Waiting for availability slots to load...')
    await page.waitForTimeout(3000)

    console.log('\n🔍 Looking for time slots...')
    const slots = await page.locator('[role="button"][aria-label*=":"]').all()
    console.log(`Found ${slots.length} potential time slots`)

    if (slots.length > 0) {
      console.log('\n⏰ Clicking first available time slot...')
      await slots[0].click()
      await page.waitForTimeout(1000)
    }

    console.log('\n📝 Looking for guest info form...')
    // Try to find and fill form
    const firstNameInput = await page.locator('input[placeholder*="First"]').first()
    if (firstNameInput) {
      console.log('Found first name input, filling form...')
      await firstNameInput.fill('Test')
      await page.locator('input[placeholder*="Last"]').first().fill('User')
      await page.locator('input[placeholder*="Email"], input[type="email"]').first().fill('test@example.com')
      await page.waitForTimeout(500)
    }

    console.log('\n🎯 Looking for Reserve/Book button...')
    const buttons = await page.locator('button').all()
    for (const btn of buttons) {
      const text = await btn.textContent()
      if (text?.includes('Reserve') || text?.includes('Book') || text?.includes('Confirm')) {
        console.log(`Clicking button: "${text}"`)
        await btn.click()
        await page.waitForTimeout(2000)
        break
      }
    }

    console.log('\n✅ Investigation complete! Check logs below.')
  } catch (error) {
    console.error('❌ Error during investigation:', error)
  }

  // Save logs
  const logFile = '/tmp/resy-investigation.json'
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2))
  console.log(`\n📋 Full logs saved to: ${logFile}`)

  // Print summary
  console.log('\n' + '='.repeat(80))
  console.log('API CALL SUMMARY')
  console.log('='.repeat(80))

  logs.forEach((log, i) => {
    const pathMatch = log.url.match(/api\.resy\.com(.*)/)
    const path = pathMatch ? pathMatch[1] : log.url

    console.log(`\n[${i + 1}] ${log.method} ${path}`)
    console.log(`    Status: ${log.responseStatus}`)

    if (log.requestBody) {
      console.log(`    Request Body: ${log.requestBody.substring(0, 150)}...`)
    }

    try {
      const body = JSON.parse(log.responseBody)
      console.log(`    Response Keys: ${Object.keys(body).join(', ')}`)

      // Look for book_token, resy_token, reservation_id
      if (JSON.stringify(body).includes('book_token')) {
        console.log(`    ⭐ FOUND book_token!`)
      }
      if (JSON.stringify(body).includes('resy_token')) {
        console.log(`    ⭐ FOUND resy_token!`)
      }
      if (JSON.stringify(body).includes('reservation_id')) {
        console.log(`    ⭐ FOUND reservation_id!`)
      }
    } catch (e) {
      // Not JSON
    }
  })

  await browser.close()
}

investigate().catch(console.error)
