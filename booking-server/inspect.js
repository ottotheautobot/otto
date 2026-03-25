const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.createContext();
  const page = await context.newPage();

  const requests = [];
  
  // Intercept all requests to api.resy.com
  page.on('request', (request) => {
    if (request.url().includes('api.resy.com')) {
      requests.push({
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        postData: request.postData(),
      });
    }
  });

  page.on('response', async (response) => {
    if (response.url().includes('api.resy.com')) {
      const lastRequest = requests[requests.length - 1];
      if (lastRequest) {
        try {
          lastRequest.responseStatus = response.status();
          lastRequest.responseBody = await response.text();
        } catch (e) {
          lastRequest.responseError = e.message;
        }
      }
    }
  });

  try {
    console.log('Loading Resy.com...');
    await page.goto('https://resy.com', { waitUntil: 'networkidle' });

    console.log('Searching for HolyWater...');
    // Search for HolyWater
    await page.fill('input[placeholder*="Restaurant"]', 'HolyWater');
    await page.waitForTimeout(500);
    
    // Click first result
    await page.click('text=HolyWater', { force: true }).catch(() => {});
    await page.waitForTimeout(1000);

    console.log('Selecting date and time...');
    // Look for available dates
    const dateButtons = await page.$$('[data-testid*="date"]');
    if (dateButtons.length > 0) {
      await dateButtons[0].click();
    }

    await page.waitForTimeout(2000);

    console.log('Looking for time slots...');
    // Try to find and click a time slot
    const timeButtons = await page.$$('button:has-text("PM")');
    if (timeButtons.length > 0) {
      await timeButtons[0].click();
    }

    await page.waitForTimeout(2000);

    console.log('Captured requests:');
    console.log(JSON.stringify(requests, null, 2));

  } catch (error) {
    console.error('Error during inspection:', error);
    console.log('Requests captured so far:');
    console.log(JSON.stringify(requests, null, 2));
  }

  await browser.close();
})();
