<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## This project

Read **`HANDOVER.md`** in the repo root before you change anything. It covers the
product, the stack, the Next.js 16 traps (`cacheComponents` forbids reading the
clock during prerender), the quota system, the environment variables, the
Hostinger VPS deployment, and what is still pending.

Short version:
- Next.js 16 App Router + React 19 + TypeScript + Tailwind v4, Supabase for auth
  and data, Claude for the AI pitches, Razorpay for payments.
- Brand: **Poppins**, **violet-600**, our own logo, **no emojis anywhere** — use
  `<Icon name="..."/>` from `src/components/Icon.tsx`.
- Before every deploy: `npx tsc --noEmit` and `npx eslint src` must pass.
- Never commit `.env.local`, `_backups/` or any zip. Never print a secret key.
- The same server runs the owner's WordPress LMS (skilearnix.com). After any
  deploy or web-server change, check that site still answers.
