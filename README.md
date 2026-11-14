# Client Finder (version 2)

Find local businesses with **no website** or a **slow website**, score them as hot leads, and pitch them on WhatsApp.

## What works in version 1
- Search any business type + city (Google Places API)
- Flags businesses with no website / social-media-only links
- Website check: mobile speed score, load time, HTTPS, mobile-friendly, SEO basics (PageSpeed Insights API)
- Hot-lead score (🔥 Hot / Warm / Cold) with the reason
- One-click WhatsApp pitch message (template based on the lead's problem)
- "My leads" tracker: New → Contacted → Replied → Won/Lost, follow-up dates (auto 3 days after contacting), notes, CSV download
- Audit report: branded A4 "Online Presence Report" with score, checks and recommendations → Download PDF
- My branding: your name, brand, WhatsApp, email and logo on pitches and reports
- Login (email + password) with Supabase; leads and branding are saved to each user's account
- Every table has Row Level Security: users can only see their own data
- The Google API routes only work for logged-in users (protects your API bill)

## Run it on your computer (Windows)
1. Install **Node.js LTS** from https://nodejs.org (if not installed). Check in a terminal: `node -v`
2. Open this folder in VS Code → Terminal → New Terminal
3. Copy `.env.example` to a new file named `.env.local` and fill in the Google API key and the Supabase URL + publishable key
   (database tables: run `supabase/schema.sql` once in the Supabase SQL Editor)
4. Run:
   ```
   npm.cmd install
   npm.cmd run dev
   ```
5. Open http://localhost:3000

## Keep the key safe
- `.env.local` is never uploaded to GitHub (it's in `.gitignore`).
- The key is only used on the server (the `src/app/api` routes), never sent to the browser.

## Coming next
- v3: AI-written pitches (Claude API), Malayalam option
- v5: Razorpay subscriptions + usage limits
