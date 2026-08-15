PROJECT: Budget Tracker 2026 · Next.js 16.2.12 + Tailwind v4 + Supabase Auth/Postgres · Live Remote Supabase Project qweklawtmnifaiesbcrb
CURRENT STATE: Full-stack PWA + OLED Dark Theme + Offline Sync + Lend & Borrow (Debts & Loans) COMPLETE, VERIFIED & LIVE.
ACTIVE TASK: Verified Lend & Borrow (Debts & Loans) tracker end-to-end on live Supabase PostgreSQL (loan creation, partial repayment calculations, dynamic progress bars, status transitions, and dashboard sync).
PENDING: None (All features tested and verified live).
LOCKED DECISIONS:
- Live Supabase Project `qweklawtmnifaiesbcrb` (Region: `ap-southeast-1`, Account: `ahmedamdad39@gmail.com`)
- Next.js 16.2.12 App Router with PWA standalone display & offline shell (`/sw.js`)
- UI Style: OLED Dark Theme (`#020617` background, `#0f172a` cards, `#1e293b` borders, Emerald/Rose/Blue high-contrast accents)
- Auth: Private single-user Sign In (no public sign-ups)
- Currency: `BDT`. Timezone: `Asia/Dhaka`.
- Money represented strictly as exact strings across frontend boundaries and `BigInt` poisha on backend. No `parseFloat` or binary floating-point money math.
- Responsive Navigation: 5-column fixed bottom bar on mobile (<768px) with central `+` action button, Debts tab, and Dashboard tab; Left sidebar on desktop (≥768px).
