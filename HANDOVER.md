# AI Client Finder — project handover

Everything another developer (or AI assistant) needs to pick this project up.
Last updated: 15 November 2026.

---

## 1. What this product is

A SaaS tool for web designers and freelancers. The user searches a city and a
business type, the app lists real businesses from Google Maps, flags the ones
with **no website or a bad website**, scores them as leads, and writes a pitch
message to send on WhatsApp.

- **Live:** https://aiclientfinderapp.com
- **Brand name:** AI Client Finder
- **Owner:** Abdul Rouf (Roufweb Solutions), Kerala, India
- **Status:** live, in production, a handful of real users. Razorpay is still in
  **test mode** — live keys are pending KYC approval.

---

## 2. Stack

| Area | Choice |
|---|---|
| Framework | Next.js 16.4.6, App Router, Turbopack, **`cacheComponents` enabled** |
| UI | React 19.3, TypeScript, Tailwind CSS v4 (no config file — tokens live in `globals.css` under `@theme inline`) |
| Font | Poppins via `next/font/google` (downloaded at build time) |
| Auth + database | Supabase (project ref `cmchgujlhucjlkvfsoys`), Row Level Security on every table |
| AI pitches | Anthropic Claude Messages API, model `claude-haiku-5-5` |
| Lead data | Google Places API (New) — Text Search with a field mask |
| Website checks | Google PageSpeed Insights API |
| Payments | Razorpay Orders API + HMAC-SHA256 signature check |
| Hosting | Hostinger VPS (KVM 4, Ubuntu 24.04), app on PM2, OpenLiteSpeed reverse proxy |

### Next.js 16 gotchas that have already bitten us
- **`cacheComponents` is on.** Reading the clock (`new Date()`, `Date.now()`)
  or other uncached dynamic data while a page prerenders **fails the build**.
  That is why `src/lib/site.ts` holds a fixed `copyrightYear` string.
- Anything reading `useSearchParams`/`params` must sit inside `<Suspense>`.
- The repo's ESLint setup rejects `setState` called directly inside
  `useEffect` (`react-hooks/set-state-in-effect`). The pattern used here is a
  module-level store read with `useSyncExternalStore` — see
  `src/lib/account.ts`, `src/lib/adminData.ts`, `src/lib/storage.ts`.
- `next build` cannot run without network the first time (it downloads the SWC
  binary and the Poppins font files).

---

## 3. How the code is laid out

```
src/app/
  page.tsx            logged out -> <Landing/>, logged in -> <FindLeads/>
  layout.tsx          font, metadata, Nav, AuthGate, Footer
  globals.css         brand tokens, animations, .btn-shine, .skeleton
  login/              email + password and Google sign-in
  leads/              saved-lead tracker
  settings/           "My branding" (name, logo, phone shown on reports)
  plans/              pricing + Razorpay checkout
  report/[id]/        printable A4 audit report (ReportView.tsx does the work)
  admin/              owner-only dashboard
  privacy|terms|refund|contact/   policy pages (public)
  api/
    search/           Google Places; counts one "search" of the user's quota
    check-site/       PageSpeed + HTML checks; counts one "check"
    pitch/            Claude; counts one "pitch"
    account/          the user's plan, expiry, usage, isAdmin
    payments/order/   creates a Razorpay order
    payments/verify/  verifies the signature, then grants Pro
    admin/overview/   every number on the admin dashboard, one call
    admin/user/       grant or remove Pro for one user

src/components/       Nav, Footer, Landing, FindLeads, PitchModal, AuthGate,
                      Logo, Icon (the whole icon set), Spinner, PageLoader,
                      LegalPage, Badges, ErrorNote
src/lib/
  types.ts            Business, SiteCheck, Lead, Profile
  score.ts            lead scoring + the template pitch + WhatsApp number
  report.ts           builds the audit report (score out of 100)
  plans.ts            LIMITS and PRICES — change plan rules here
  site.ts             brand name, support email, phone, address, year
  supabase.ts         browser client + userFromRequest() for API routes
  server.ts           SERVER ONLY (imports "server-only"): admin DB client,
                      getAccount, consume/refund quota, grantPro, revokePro,
                      adminFromRequest
  storage.ts          leads + profile store, synced to Supabase
  account.ts          the current user's plan/usage store
  adminData.ts        the admin dashboard store
supabase/
  schema.sql          leads + profiles tables and their RLS policies
  plans.sql           accounts, usage, payments + consume_usage/refund_usage
```

### Design rules the whole site follows
- **Poppins** everywhere; **violet** (`violet-600`) is the brand colour —
  there is no blue or indigo left in the codebase, keep it that way.
- **No emojis anywhere** — in the UI, in the WhatsApp pitch text, or in the
  AI's system prompt. Use `<Icon name="..."/>` from `src/components/Icon.tsx`.
  Add new glyphs to that file rather than pulling in an icon library.
- Minimal and modern: white cards, `rounded-2xl`, `ring-1 ring-slate-200`,
  generous spacing.
- Entrance animation: `animate-fade-up` plus `delay-1`…`delay-6`.
  Important buttons also get `btn-shine` (a white flash sweeping across).
  All of it is disabled under `prefers-reduced-motion`.

---

## 4. Plans, limits and quota

`src/lib/plans.ts` is the single source of truth:

```ts
LIMITS = {
  free: { searches: 3,  pitches: 10,  checks: 30 },
  pro:  { searches: 25, pitches: 300, checks: 1000 },
}
PRICES = {
  monthly: { amountPaise: 29900,  days: 30  },  // Rs 299
  yearly:  { amountPaise: 199900, days: 365 },  // Rs 1,999
}
```

Quota is enforced **in the database**, not in JavaScript: the Postgres function
`consume_usage(user, kind, limit)` increments a row and returns `-1` when the
limit is hit. It is `security definer` and only `service_role` may run it. If a
paid API call then fails, the route calls `refund_usage`. Keep that pattern for
any new metered feature — it is what stops a user from burning the Google and
Anthropic bill.

Plans are **one-time payments for a fixed period**. There is no auto-renewal
and no subscription object in Razorpay; `grantPro` extends from the current
expiry date.

---

## 5. Admin dashboard

`/admin`, reachable only by the emails listed in the `ADMIN_EMAILS`
environment variable (comma separated). `adminFromRequest()` in
`src/lib/server.ts` checks the bearer token against that list, so a user
cannot reach the admin API by guessing the URL. The nav link is hidden for
everyone else. It shows users, earnings, 30-day charts, usage, payments, and
can grant or remove Pro.

---

## 6. Environment variables

Kept in `.env.local`, which is **git-ignored and must never be committed**.
`.env.example` lists the names with empty values.

```
GOOGLE_API_KEY                        Places (New) + PageSpeed, restricted to those two APIs
NEXT_PUBLIC_SUPABASE_URL              https://cmchgujlhucjlkvfsoys.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  safe in the browser (RLS protects the data)
ANTHROPIC_API_KEY                     server only, no expiry
SUPABASE_SECRET_KEY                   server only — bypasses RLS, treat as top secret
RAZORPAY_KEY_ID                       currently rzp_test_...
RAZORPAY_KEY_SECRET                   server only
ADMIN_EMAILS                          who can open /admin
```

On the server these live in `/var/www/client-finder/.env.local` (chmod 600).
They are **not** in GitHub, so a fresh clone needs them added by hand.

---

## 7. Infrastructure and deployment

- **Server:** Hostinger VPS, IP `31.97.190.167`, Ubuntu 24.04.
  The **same server also runs the owner's WordPress LMS at skilearnix.com** —
  always check that site still answers after touching the web server config.
- **App:** Node 22 (installed under `/usr/local`), PM2 process `client-finder`,
  listening on `127.0.0.1:3100` (see `ecosystem.config.js`).
- **Web server:** OpenLiteSpeed, **not Nginx**. `nginx-client-finder.conf` is
  left over and unused. The site's own config is
  `/usr/local/lsws/conf/vhosts/clientfinder/vhconf.conf`; the domain mapping and
  the `virtualhost clientfinder` block are in
  `/usr/local/lsws/conf/httpd_config.conf`. A backup of that file from before
  this app was added is at `/root/httpd_config.conf.before-clientfinder`.
- **SSL:** Let's Encrypt via certbot, webroot `/var/www/cf-acme`, auto-renews
  and reloads OpenLiteSpeed with a deploy hook.
- **Deploy:** push to `main` on GitHub (`roufweb1-sudo/client-finder`, private),
  then on the server:
  ```
  cd /var/www/client-finder && bash deploy.sh
  ```
  which runs `git pull --ff-only`, `npm ci`, `npm run build`,
  `pm2 startOrReload ecosystem.config.js --update-env`, `pm2 save`.
  `set -euo pipefail` means a failed build stops before restarting, so a broken
  build leaves the old version serving. Run it with
  `nohup bash deploy.sh > /tmp/deploy.log 2>&1 &` if the web terminal tends to
  drop.
- The server pulls from GitHub with a **read-only deploy key** (`~/.ssh/cf_deploy`).
  It cannot push.
- **Rollback:** `git reset --hard <previous-sha>` then run `deploy.sh` again.

---

## 8. Email

`support@aiclientfinderapp.com` runs on **Zoho Mail (free plan)**, webmail at
mail.zoho.in. MX, SPF and DKIM records are in Hostinger DNS. Free plan has no
IMAP/POP, so it cannot be added to Gmail.

---

## 9. Known gaps / what to do next

1. **Razorpay live keys** — blocked on KYC. Switch `RAZORPAY_KEY_ID` and
   `RAZORPAY_KEY_SECRET` on the server, then test one real payment.
2. **Google OAuth consent screen is unpublished**, so Google shows an
   "unverified app" warning on sign-in. The privacy policy page now exists, so
   it can be submitted for verification.
3. **Old API keys** (Google, Anthropic, the Supabase `default` secret) are still
   active as a fallback and should be deleted once the live keys are confirmed.
4. **The VPS renewal failed** for insufficient balance; it expires 9 Dec 2026.
   If it lapses, the LMS goes down too.
5. `copyrightYear` in `src/lib/site.ts` needs changing each January.
6. The contact page states Mon–Sat business hours — unconfirmed by the owner.
7. No automated tests at all. `tsc --noEmit` and `eslint src` are the only
   checks; run both before every deploy.
8. Email sending (receipts, password resets) still uses Supabase's default
   sender; a proper SMTP sender is not set up.

---

## 10. House rules

- **Never commit `.env.local`, the `_backups/` folder, or any zip.**
- **Never print a secret key** into a terminal, a log, a commit or a chat.
- The owner is not a professional developer: explain changes in plain English,
  and say what you changed and what you did not touch.
- Make the change that was asked for and nothing else.
- Before deploying: `npx tsc --noEmit` and `npx eslint src` must both pass.
- After deploying: check `https://aiclientfinderapp.com/` **and**
  `https://skilearnix.com/` both return 200.
