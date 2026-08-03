# Frontend Plan - Budget Tracker 2026

## 1. Responsive Architecture & Navigation
- **Mobile (<768px)**: Fixed bottom navigation bar with 4 destinations:
  1. Dashboard (`/dashboard`)
  2. Transactions (`/transactions`)
  3. Yearly Review (`/review/yearly`)
  4. Settings (`/settings`)
- **Desktop (≥768px)**: Compact left sidebar with the same destinations.
- **Root Redirect**: Accessing `/` automatically performs a server redirect to `/dashboard`.
- **Add Transaction Button**: Persistent `+` button in the navigation shell. In Phase 1 Foundation, rendered as a visually disabled control (`<button disabled aria-disabled="true" ...>`) labeled "Add Transaction (Phase 2)".

## 2. Protected Routes & Authentication Strategy
- Routes inside `(protected)` layout require authenticated session verified via `@supabase/ssr` `getClaims()`.
- Unauthenticated requests are redirected by `proxy.ts` to `/login`.
- `/login` is publicly accessible with email and password fields only. No `/signup` route or link.
- Settings page includes an active Sign Out action.

## 3. Calm Finance Design System
- **Background**: Neutral off-white (`bg-neutral-50` / `bg-slate-50`).
- **Cards**: Clean white cards (`bg-white`) with subtle borders and soft shadows.
- **Color Palette**:
  - Income: Blue (`text-blue-600`, `bg-blue-50`)
  - Expenses: Coral/Red (`text-rose-600`, `bg-rose-50`)
  - Savings: Emerald (`text-emerald-600`, `bg-emerald-50`)
  - Available Balance: Dark Neutral (`text-slate-900`)
- **Accessibility**: High contrast, visible focus outlines, semantic HTML5, and touch targets ≥44px.
