# Booking Server Deployment (Fly.io)

This is a persistent Playwright service that Otto calls to complete Resy bookings.

## Prerequisites

1. **Fly.io account** — Sign up at https://fly.io (free tier available)
2. **Fly CLI** — Install from https://fly.io/docs/getting-started/installing-flyctl/
3. **Your Resy cookies** — From your browser session

## Setup

### 1. Extract Your Resy Cookies

Log in to Resy, open DevTools Console, and run:

```javascript
copy(JSON.stringify(document.cookie.split('; ').map(c => {
  const [name, value] = c.split('=');
  return { name, value, domain: '.resy.com', path: '/' };
})))
```

This copies your cookies to clipboard. Paste into `cookies.json`:

```bash
# In booking-server folder:
cat > cookies.json << 'EOF'
[paste the JSON here]
EOF
```

### 2. Set Environment Variables

Generate a random token:

```bash
openssl rand -hex 32
# Output: a1b2c3d4e5f6... (copy this)
```

Update `fly.toml`:

```toml
[env]
  AUTH_TOKEN = "a1b2c3d4e5f6..." # Your random token
  RESY_COOKIES = "[{\"name\":\"uuid\", ...}]" # Your cookies JSON
```

### 3. Deploy

```bash
cd booking-server

# Create Fly app (first time only)
flyctl launch --name resy-booking-server

# Deploy
flyctl deploy

# Monitor logs
flyctl logs -f
```

After deploy, you'll get a URL like: `https://resy-booking-server.fly.dev`

### 4. Test the Endpoint

```bash
curl -X POST https://resy-booking-server.fly.dev/book \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-auth-token",
    "venue_id": "68244",
    "date": "2026-03-17",
    "party_size": 2,
    "time_slot": "19:00",
    "first_name": "Allen",
    "last_name": "Hall",
    "email": "ahall.email@gmail.com"
  }'
```

Should return:

```json
{
  "success": true,
  "reservation_id": 848453889,
  "resy_token": "vI|zyZbpALXJlBkup..."
}
```

## Update Otto's Booking URL

In Otto's environment variables (`.env.local` or Vercel):

```
BOOKING_SERVER_URL=https://resy-booking-server.fly.dev
BOOKING_SERVER_TOKEN=your-auth-token
```

The scheduler will now call this service instead of trying to run Playwright on Vercel.

## Costs

- **Free tier:** 3 shared-cpu-1x 256MB VMs, 3GB storage (enough for this)
- **Paid:** ~$5/month for dedicated small instance

This service runs 24/7 and is always ready to book.

## Monitoring

```bash
# Check status
flyctl status

# View logs
flyctl logs

# Scale (if needed)
flyctl scale vm standard-1x --count 1
```

## Troubleshooting

**Service won't start:**
```bash
flyctl logs -f
```

Check for:
- Playwright installation errors
- Auth token issues
- Cookie format problems

**Bookings failing:**
- Verify cookies are fresh (not expired)
- Check Resy website works manually first
- Ensure `venue_id` is correct

---

Once deployed, Otto will automatically call this service when availability is detected!
