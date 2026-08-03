PROJECT: Budget Tracker 2026 · Next.js 16.2.12 + Tailwind v4 + Supabase Auth/Postgres · Local Workspace
CURRENT STATE: Initializing foundation phase (backend first)
ACTIVE TASK: Scaffolding project and implementing database migrations, BigInt calculations, and documentation
PENDING: Next.js 16 proxy auth, protected placeholder routes, `/login` page, Vitest & RLS tests, verification checks
LOCKED DECISIONS:
- Next.js 16.2.12 with `proxy.ts` and `src/lib/supabase/proxy.ts` using `getClaims()` for auth protection
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (no anon key)
- Money stored as `amount_poisha bigint` (1 BDT = 100 poisha)
- Allocation targets stored as integer basis points (`needs_bp`, `wants_bp`, `savings_bp`) totaling 10000 (2000, 1000, 7000)
- BigInt integer math only with half-up rounding and Savings remainder balancing (no floating point, no `numeric(14,2)`, no `decimal.js`, no `parseFloat`)
- Explicit REVOKE and GRANT statements scoped only to `profiles`, `categories`, `transactions`, `budget_plans`, `monthly_notes`
- RLS policies per command with `(select auth.uid())` ownership check
- `categories` table has `UNIQUE (id, user_id, kind)` constraint supporting composite foreign key `(category_id, user_id, kind)` on `transactions`
- `public.onboard_user()` PL/pgSQL function (`SECURITY INVOKER`, `SET search_path = public`, `ON CONFLICT DO NOTHING`, `GRANT EXECUTE` to `authenticated` only)
- `ensureOnboardedUser()` server-side helper called after auth in protected routes
- Disabled public signup in `supabase/config.toml` (`enable_signup = false`)
- Native `disabled` attribute on nonfunctional placeholder controls
