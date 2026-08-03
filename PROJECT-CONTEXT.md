PROJECT: Budget Tracker 2026 · Next.js 16.2.12 + Tailwind v4 + Supabase Auth/Postgres · Live Remote Supabase Project qweklawtmnifaiesbcrb
CURRENT STATE: Full-stack MVP (Backend + Frontend) 100% COMPLETE & VERIFIED.
ACTIVE TASK: Built and verified responsive frontend MVP (/login, /dashboard, /transactions, /review/yearly, /settings, TransactionFormModal sheet/dialog, Chrome DevTools visual QA, Graphify re-indexing).
PENDING: None (Locked MVP boundaries fully satisfied).
LOCKED DECISIONS:
- Live Supabase Project `qweklawtmnifaiesbcrb` (Region: `ap-southeast-1`)
- Next.js 16.2.12 App Router with `proxy.ts` and `src/lib/supabase/proxy.ts`
- Currency: `BDT`. Timezone: `Asia/Dhaka`.
- Money represented strictly as exact strings across frontend boundaries and `BigInt` poisha on backend. No `parseFloat` or binary floating-point money math.
- Responsive Navigation: Fixed bottom bar on mobile (<768px) with central `+` action; Left sidebar on desktop (≥768px).
- Transaction Form: Bottom sheet on mobile / Dialog on desktop with kind toggle (`expense`, `saving`, `income`), amount decimal string, kind-filtered category, description, date (Asia/Dhaka), optional note, client-side idempotency `request_id`, and native `disabled` during submission.
- Excluded features (Deferred by design): Investment tracking, Salary payment tracking, category-management UI, monthly notes UI, CSV/Excel/PDF export, bank integrations, receipt upload, AI advice, recurring transactions, shared accounts, multi-currency, offline PWA, dark mode toggle, public signup, marketing pages.
