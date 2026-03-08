# Otto Setup Instructions

## Prerequisites

1. **GitHub Repository**
   - Create a new public repo: `https://github.com/ottotheautobot/otto`
   - Then in your terminal:
     ```bash
     cd /home/node/.openclaw/workspace/projects/otto
     git remote add origin https://github.com/ottotheautobot/otto.git
     git push -u origin main
     ```

2. **Supabase Project**
   - Go to https://supabase.com
   - Create a new project in your organization
   - Copy your project URL and Service Role Key
   - Run the SQL from `db-schema.sql` in the Supabase SQL editor

3. **Password Setup**
   - Generate a bcrypt hash:
     ```bash
     npm install -g bcryptjs
     node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your_password_here', 10))"
     ```
   - Copy the hash to your `.env.local` as `AUTH_PASSWORD_HASH`

4. **Environment Variables**
   - Copy `.env.local.example` to `.env.local`
   - Fill in:
     - `NEXT_PUBLIC_SUPABASE_URL` (from Supabase)
     - `SUPABASE_SERVICE_ROLE_KEY` (from Supabase)
     - `AUTH_PASSWORD_HASH` (from step 3)
     - `RESY_API_KEY` and `RESY_AUTH_TOKEN` (you have these)
     - `TELEGRAM_CHAT_ID=1204034991`

5. **Deploy to Vercel**
   - Go to https://vercel.com
   - Connect your GitHub repo (`ottotheautobot/otto`)
   - Add environment variables from `.env.local`
   - Deploy

## Development

```bash
npm install
npm run dev
# Open http://localhost:3000/login
```

## First Time

1. Login with your password
2. Add Torrisi as your first restaurant
3. Set booking preferences (dates, times)
4. Watch the dashboard as the bot runs

---

Done? Message me and we'll start building the restaurant management pages and cron scheduler.
