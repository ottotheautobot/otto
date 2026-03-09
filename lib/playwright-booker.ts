import { chromium, Browser, Page, BrowserContext } from 'playwright'

interface BookingRequest {
  venueId: string
  date: string // YYYY-MM-DD
  partySize: number
  timeSlot: string // HH:MM format
  firstName: string
  lastName: string
  email: string
}

interface BookingResult {
  success: boolean
  reservationId?: string
  resyToken?: string
  bookToken?: string
  error?: string
}

export class PlaywrightBooker {
  private browser: Browser | null = null

  async initialize() {
    this.browser = await chromium.launch({
      headless: false, // Show browser for manual login
    })
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async bookReservation(req: BookingRequest): Promise<BookingResult> {
    if (!this.browser) {
      await this.initialize()
    }

    const page = await this.browser!.newPage()
    let bookingResult: BookingResult = { success: false }

    try {
      // Intercept /3/book response to capture booking confirmation
      page.on('response', async (response) => {
        if (response.url().includes('/3/book') && response.status() === 201) {
          try {
            const data = await response.json()
            if (data.reservation_id) {
              bookingResult = {
                success: true,
                resyToken: data.resy_token,
                reservationId: String(data.reservation_id),
              }
              console.log(`✅ Booking confirmed! Reservation ID: ${data.reservation_id}`)
            }
          } catch (e) {
            console.error('Could not parse booking response:', e)
          }
        }
      })

      // Navigate to venue page
      const venueUrl = `https://resy.com/cities/new-york-ny/venues/holywater?date=${req.date}`
      console.log(`Navigating to ${venueUrl}`)
      await page.goto(venueUrl, { waitUntil: 'networkidle', timeout: 60000 })

      console.log('Page loaded. Waiting for you to select a time slot...')
      await page.waitForTimeout(3000)

      // Look for time slot buttons
      const timeSlots = await page.locator('button[aria-label*=":"]').all()
      console.log(`Found ${timeSlots.length} time slots`)

      if (timeSlots.length > 0) {
        const slotText = await timeSlots[0].textContent()
        console.log(`Clicking time slot: ${slotText}`)
        await timeSlots[0].click()
        await page.waitForTimeout(1500)
      }

      // Fill in guest details
      console.log('Filling guest information...')
      await page.fill('input[placeholder*="First"]', req.firstName).catch(() => {
        console.log('Could not fill first name')
      })
      await page.fill('input[placeholder*="Last"]', req.lastName).catch(() => {
        console.log('Could not fill last name')
      })
      await page.fill('input[placeholder*="Email"], input[type="email"]', req.email).catch(() => {
        console.log('Could not fill email')
      })

      await page.waitForTimeout(1000)

      // Find and click Reserve button
      console.log('Looking for Reserve button...')
      const buttons = await page.locator('button').all()
      let reserveClicked = false

      for (const button of buttons) {
        try {
          const text = await button.textContent()
          if (text?.includes('Reserve') || text?.includes('Book') || text?.includes('Confirm')) {
            console.log(`Clicking: ${text}`)
            await button.click()
            reserveClicked = true
            break
          }
        } catch (e) {
          // Skip
        }
      }

      if (!reserveClicked) {
        console.log('⚠️ Could not find Reserve button')
      }

      // Wait for booking response
      console.log('Waiting for booking confirmation...')
      await page.waitForTimeout(5000)

      return bookingResult
    } catch (error) {
      console.error('Booking error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      await page.close()
    }
  }
}
