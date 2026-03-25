const express = require('express');
const { chromium } = require('playwright');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Simple auth token (set via env var)
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'test-token';

// Resy cookies (set via env var as JSON)
const RESY_COOKIES = process.env.RESY_COOKIES 
  ? JSON.parse(process.env.RESY_COOKIES)
  : [];

/**
 * POST /book
 * Body: { venue_id, date, party_size, time_slot, first_name, last_name, email }
 * Returns: { success, reservation_id, resy_token, error }
 */
app.post('/book', async (req, res) => {
  const { venue_id, date, party_size, time_slot, first_name, last_name, email, token } = req.body;

  // Validate token
  if (token !== AUTH_TOKEN) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  // Validate params
  if (!venue_id || !date || !party_size || !time_slot || !first_name || !last_name || !email) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
  }

  let browser = null;
  try {
    console.log(`[${new Date().toISOString()}] Booking: ${first_name} ${last_name} at ${venue_id} on ${date} ${time_slot}`);

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Add Resy cookies if available
    if (RESY_COOKIES.length > 0) {
      await page.context().addCookies(RESY_COOKIES);
    }

    let bookingResult = { success: false };

    // Capture /3/book response
    page.on('response', async (response) => {
      if (response.url().includes('/3/book') && response.status() === 201) {
        try {
          const data = await response.json();
          if (data.reservation_id) {
            bookingResult = {
              success: true,
              reservation_id: data.reservation_id,
              resy_token: data.resy_token,
            };
            console.log(`✅ Booking successful: ${data.reservation_id}`);
          }
        } catch (e) {
          console.error('Could not parse booking response:', e);
        }
      }
    });

    // Navigate to venue
    const venueUrl = `https://resy.com/cities/new-york-ny/venues/holywater?date=${date}`;
    await page.goto(venueUrl, { waitUntil: 'networkidle', timeout: 60000 });

    // Click time slot
    const timeSlots = await page.locator('button[aria-label*=":"]').all();
    console.log(`Found ${timeSlots.length} time slots`);

    if (timeSlots.length > 0) {
      await timeSlots[0].click();
      await page.waitForTimeout(1000);
    }

    // Fill form
    await page.fill('input[placeholder*="First"]', first_name).catch(() => {});
    await page.fill('input[placeholder*="Last"]', last_name).catch(() => {});
    await page.fill('input[placeholder*="Email"], input[type="email"]', email).catch(() => {});

    await page.waitForTimeout(500);

    // Click Reserve
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      try {
        const text = await button.textContent();
        if (text?.includes('Reserve') || text?.includes('Book') || text?.includes('Confirm')) {
          await button.click();
          break;
        }
      } catch (e) {}
    }

    // Wait for booking
    await page.waitForTimeout(5000);
    await page.close();

    res.json(bookingResult);
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

/**
 * GET /inspect
 * Inspects Resy.com HolyWater availability and captures network requests
 */
app.get('/inspect', async (req, res) => {
  let browser = null;
  try {
    console.log('[INSPECT] Starting Resy inspection for HolyWater...');

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const requests = [];

    // Capture all api.resy.com requests
    page.on('request', (request) => {
      if (request.url().includes('api.resy.com')) {
        requests.push({
          method: request.method(),
          url: request.url(),
          headers: request.headers(),
          postData: request.postData(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    page.on('response', async (response) => {
      if (response.url().includes('api.resy.com')) {
        const lastRequest = requests[requests.length - 1];
        if (lastRequest) {
          try {
            lastRequest.responseStatus = response.status();
            lastRequest.responseHeaders = response.headers();
            const text = await response.text();
            lastRequest.responseBody = text.substring(0, 2000); // First 2000 chars
          } catch (e) {
            lastRequest.responseError = e.message;
          }
        }
      }
    });

    console.log('[INSPECT] Loading Resy.com...');
    await page.goto('https://resy.com', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('[INSPECT] Navigating to HolyWater...');
    await page.goto('https://resy.com/cities/new-york-ny/venues/holywater', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });

    await page.waitForTimeout(2000);

    console.log('[INSPECT] Looking for available dates...');
    const dateButtons = await page.locator('[aria-label*="2026"]').all();
    console.log(`[INSPECT] Found ${dateButtons.length} date buttons`);

    if (dateButtons.length > 0) {
      await dateButtons[0].click();
      await page.waitForTimeout(1500);
    }

    console.log('[INSPECT] Looking for time slots...');
    const timeSlots = await page.locator('button:has-text("PM"), button:has-text("AM")').all();
    console.log(`[INSPECT] Found ${timeSlots.length} time slots`);

    if (timeSlots.length > 0) {
      await timeSlots[0].click();
      await page.waitForTimeout(1500);
    }

    console.log(`[INSPECT] Captured ${requests.length} API requests`);
    await page.close();

    res.json({
      status: 'success',
      requestsCount: requests.length,
      requests: requests,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[INSPECT] Error:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Booking server running on port ${PORT}`);
  console.log(`Set AUTH_TOKEN env var to enable /book endpoint`);
});
