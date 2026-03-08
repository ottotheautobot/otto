import { chromium, Browser, Page } from 'playwright'

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
  error?: string
}

export class PlaywrightBooker {
  private browser: Browser | null = null

  async initialize() {
    this.browser = await chromium.launch({
      headless: true,
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
      // Intercept the /3/book request to capture booking details
      page.on('response', async (response) => {
        if (response.url().includes('/3/book')) {
          if (response.status() === 200) {
            try {
              const data = await response.json()
              if (data.resy_token && data.reservation_id) {
                bookingResult = {
                  success: true,
                  resyToken: data.resy_token,
                  reservationId: String(data.reservation_id),
                }
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      })

      // Navigate to venue page
      const venueUrl = `https://resy.com/cities/new-york-ny/venues/holywater?date=${req.date}`
      await page.goto(venueUrl, { waitUntil: 'networkidle' })

      // Wait for availability to load
      await page.waitForSelector('[data-time-slot]', { timeout: 10000 }).catch(() => null)

      // Find and click the matching time slot
      const timeSlots = await page.locator('[data-time-slot]').all()
      let slotFound = false

      for (const slot of timeSlots) {
        const slotText = await slot.textContent()
        if (slotText?.includes(req.timeSlot)) {
          await slot.click()
          slotFound = true
          break
        }
      }

      if (!slotFound) {
        return { success: false, error: `Time slot ${req.timeSlot} not found` }
      }

      // Wait for party size confirmation (if needed)
      await page.waitForTimeout(500)

      // Fill in guest details
      await page.fill('input[placeholder*="First"]', req.firstName).catch(() => null)
      await page.fill('input[placeholder*="Last"]', req.lastName).catch(() => null)
      await page.fill('input[placeholder*="Email"]', req.email).catch(() => null)

      // Click reserve/confirm button
      const reserveButton = await page
        .locator('button:has-text("Reserve"), button:has-text("Confirm"), button:has-text("Book")')
        .first()

      if (reserveButton) {
        await reserveButton.click()

        // Wait for booking confirmation
        await page.waitForTimeout(2000)
      }

      return bookingResult.success
        ? bookingResult
        : { success: false, error: 'Booking failed or confirmation not received' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      await page.close()
    }
  }
}
