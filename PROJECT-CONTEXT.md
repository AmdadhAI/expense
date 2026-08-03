PROJECT: Budget Tracker 2026 · Next.js 16.2.12 + Tailwind v4 + Supabase Auth/Postgres · Live Remote Supabase Project qweklawtmnifaiesbcrb
CURRENT STATE: Full-stack PWA + OLED Dark Theme Redesign COMPLETE & VERIFIED.
ACTIVE TASK: Configured Next.js web app manifest, offline service worker, Apple touch icons, mobile PWA meta tags, ui-ux-pro-max OLED dark theme system across all pages, custom touch-friendly category picker, account credentials security settings, and private Sign In login screen.
PENDING: None (All feature requests completed & deployed to Vercel/GitHub).
LOCKED DECISIONS:
- Live Supabase Project `qweklawtmnifaiesbcrb` (Region: `ap-southeast-1`)
- Next.js 16.2.12 App Router with PWA standalone display & offline shell (`/sw.js`)
- UI Style: OLED Dark Theme (`#020617` background, `#0f172a` cards, `#1e293b` borders, Emerald/Rose/Blue high-contrast accents)
- Auth: Private single-user Sign In (no public sign-ups)
- Currency: `BDT`. Timezone: `Asia/Dhaka`.
- Money represented strictly as exact strings across frontend boundaries and `BigInt` poisha on backend. No `parseFloat` or binary floating-point money math.
- Responsive Navigation: Fixed bottom bar on mobile (<768px) with central `+` action; Left sidebar on desktop (≥768px).
