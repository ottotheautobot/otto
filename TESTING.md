# Otto Testing Guide

## Full Booking Flow

### 1. **Add a Restaurant with Open Availability**
- Go to Dashboard → Manage Restaurants
- Search for a restaurant that currently has availability (not Torrisi — that's 30 days advance)
- Examples: casual restaurants, lunch spots, or weekend dates that might have last-minute availability
- Add the venue ID and details

### 2. **Create a Booking Preference**
- Click "Manage Preferences" on the restaurant
- Select target dates with available slots
- Set party size, time range (e.g., 6:00 PM – 8:00 PM)
- Save preference

### 3. **Manually Trigger the Booking Scheduler**
- Go to Dashboard → Test Booking
- Click "Run Booking Scheduler"
- Results appear instantly (no waiting for 10am ET daily cron)

### 4. **Check Results**
- **Activity Log** → see all booking attempts
- **Booked Confirmations** → see successful bookings
- **Telegram** → should receive notification (once Vercel domain is configured in cron)

---

## What Gets Tested

### Availability Check
- Resy API query for venue + date + party size
- Filters slots by preferred time range
- Selects earliest available time

### Booking Attempt
- Books the selected slot
- Captures confirmation ID
- Stores in database

### Activity Logging
- Records each attempt (success/failure)
- Tracks timestamp, dates, times
- Shows error messages on failure

### Notifications
- Telegram alert on successful booking (after cron domain configured)
- Summary of all attempts

---

## Troubleshooting

### "No availability in range"
- Restaurant might not have slots open for those dates
- Try a different restaurant or closer-to-today dates

### "No availability in preferred time range"
- Availability exists but not between your min/max times
- Try expanding the time range

### Booking fails but shows availability
- Resy API might have changed or requires different format
- Check browser console for detailed error message

### No Telegram message
- Update the cron job with your actual Vercel domain
- Message won't send until next scheduled run (10am ET daily)

---

## Next Steps

1. **Find test restaurant** with open near-term availability
2. **Run booking scheduler** via test page
3. **Verify activity log** entries appear
4. **Confirm Vercel domain** and update cron job
5. **Wait for daily run** or manually test again
6. **Receive Telegram alert** on successful booking
