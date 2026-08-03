PROJECT: Budget Tracker 2026 · Next.js 16.2.12 + Tailwind v4 + Supabase Auth/Postgres · Live Remote Supabase Project qweklawtmnifaiesbcrb
CURRENT STATE: Backend foundation and feature layer 100% COMPLETE & VERIFIED. Frontend UI implementation NOT STARTED.
ACTIVE TASK: Completed and proved complete MVP backend layer (database schema, migrations, RLS, onboarding RPC, BigInt money math, transactions/categories/budget-plans/monthly-notes/reports services, DTO contracts, Vitest suite, ESLint, TypeScript typecheck, build, secret scan, Graphify).
PENDING: Next phase — Frontend UI implementation (Dashboard cards, Add Transaction sheet, Transactions list, Yearly Review charts, Settings page UI).
LOCKED DECISIONS:
- Live Supabase Project `qweklawtmnifaiesbcrb` (Region: `ap-southeast-1`) created and populated via Supabase MCP
- Next.js 16.2.12 with `proxy.ts` and `src/lib/supabase/proxy.ts` using `getUser()` for verified server-side auth
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_dBNUWDGqKirE1TQ_5lxUeg_1dys2GAD`)
- Money stored as `amount_poisha bigint` (1 BDT = 100 poisha); targets stored as integer basis points (`needs_bp`, `wants_bp`, `savings_bp`) totaling 10000; BigInt integer math only with half-up rounding and Savings remainder balancing (no floating point, no `numeric(14,2)`, no `decimal.js`, no `parseFloat`)
- Explicit REVOKE and GRANT statements scoped only to `profiles`, `categories`, `transactions`, `budget_plans`, `monthly_notes`
- RLS policies per command with `(select auth.uid())` ownership check
- `categories` table has `categories_composite_key UNIQUE (id, user_id, kind)` constraint and `categories_user_name_kind_idx` supporting composite foreign key `(category_id, user_id, kind)` on `transactions`
- `public.onboard_user()` PL/pgSQL function (`SECURITY INVOKER`, `SET search_path = public`, `ON CONFLICT DO NOTHING`, `GRANT EXECUTE` to `authenticated` only)
- `ensureOnboardedUser()` server-side helper called after auth in protected routes
- Disabled public signup in `supabase/config.toml` (`enable_signup = false`)
- Native `disabled` attribute on nonfunctional placeholder controls
