PROJECT: Budget Tracker 2026 · Next.js 16.2.12 + Tailwind v4 + Supabase Auth/Postgres · Live Remote Supabase Project qweklawtmnifaiesbcrb
CURRENT STATE: Full-stack PWA + OLED Dark Theme + Offline Sync + Lend & Borrow (Debts & Loans) COMPLETE & VERIFIED.
ACTIVE TASK: Implemented Lend & Borrow (Debts & Loans) tracker with Lent vs Borrowed record tracking, partial and full settlement logging, net position balance calculation, progress indicators, search/filter controls, and dashboard & mobile navigation integration.
PENDING: User to run `supabase/migrations/20260814000000_debts_and_loans.sql` in Supabase SQL Editor if not already executed.
LOCKED DECISIONS:
- Live Supabase Project `qweklawtmnifaiesbcrb` (Region: `ap-southeast-1`)
- Next.js 16.2.12 App Router with PWA standalone display & offline shell (`/sw.js`)
- UI Style: OLED Dark Theme (`#020617` background, `#0f172a` cards, `#1e293b` borders, Emerald/Rose/Blue high-contrast accents)
- Auth: Private single-user Sign In (no public sign-ups)
- Currency: `BDT`. Timezone: `Asia/Dhaka`.
- Money represented strictly as exact strings across frontend boundaries and `BigInt` poisha on backend. No `parseFloat` or binary floating-point money math.
- Responsive Navigation: 5-column fixed bottom bar on mobile (<768px) with central `+` action button, Debts tab, and Dashboard tab; Left sidebar on desktop (≥768px).
