# Backend Plan - Budget Tracker 2026

## 1. Schema Design & Constraints
- `profiles`:
  - `id uuid primary key references auth.users(id) on delete cascade`
  - `currency text not null default 'BDT'`
  - `timezone text not null default 'Asia/Dhaka'`
  - `created_at timestamptz default now()`, `updated_at timestamptz default now()`
- `categories`:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade`
  - `name text not null`
  - `kind text not null check (kind in ('income', 'expense', 'saving'))`
  - `default_bucket text check (default_bucket in ('needs', 'wants', 'savings') or default_bucket is null)`
  - `is_active boolean not null default true`
  - `created_at timestamptz default now()`, `updated_at timestamptz default now()`
  - `CONSTRAINT categories_user_name_kind_key UNIQUE (user_id, lower(name), kind)`
  - `CONSTRAINT categories_composite_key UNIQUE (id, user_id, kind)`
- `transactions`:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade`
  - `kind text not null check (kind in ('income', 'expense', 'saving'))`
  - `amount_poisha bigint not null check (amount_poisha > 0)`
  - `description text not null`
  - `transaction_date date not null`
  - `category_id uuid not null`
  - `bucket text check (bucket in ('needs', 'wants', 'savings') or bucket is null)`
  - `note text`
  - `created_at timestamptz default now()`, `updated_at timestamptz default now()`
  - Constraints:
    - Income bucket check: `(kind = 'income' and bucket is null)`
    - Expense bucket check: `(kind = 'expense' and bucket in ('needs', 'wants'))`
    - Saving bucket check: `(kind = 'saving' and bucket = 'savings')`
    - Composite foreign key: `FOREIGN KEY (category_id, user_id, kind) REFERENCES categories(id, user_id, kind) ON DELETE RESTRICT`
- `budget_plans`:
  - `user_id uuid references auth.users(id) on delete cascade`
  - `year smallint not null`
  - `needs_bp integer not null check (needs_bp between 0 and 10000)`
  - `wants_bp integer not null check (wants_bp between 0 and 10000)`
  - `savings_bp integer not null check (savings_bp between 0 and 10000)`
  - `PRIMARY KEY (user_id, year)`
  - `CONSTRAINT budget_plans_bp_sum CHECK (needs_bp + wants_bp + savings_bp = 10000)`
- `monthly_notes`:
  - `user_id uuid references auth.users(id) on delete cascade`
  - `year smallint not null`
  - `month smallint not null check (month between 1 and 12)`
  - `note text not null default ''`
  - `PRIMARY KEY (user_id, year, month)`

## 2. Table-Scoped Grants & Row Level Security (RLS)
- Explicit Table Grants:
  - `REVOKE ALL ON TABLE profiles, categories, transactions, budget_plans, monthly_notes FROM PUBLIC, anon;`
  - `GRANT USAGE ON SCHEMA public TO authenticated;`
  - `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profiles, categories, transactions, budget_plans, monthly_notes TO authenticated;`
- RLS Policies for `authenticated`:
  - `SELECT`: `USING ((select auth.uid()) = user_id)` (or `id` for profiles)
  - `INSERT`: `WITH CHECK ((select auth.uid()) = user_id)`
  - `UPDATE`: `USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id)`
  - `DELETE`: `USING ((select auth.uid()) = user_id)`

## 3. Transactional Onboarding
- `public.onboard_user()` PL/pgSQL function (`SECURITY INVOKER`, `SET search_path = public`).
- Creates user profile, 2026 budget plan (2000/1000/7000 bp), and generic starter categories using `ON CONFLICT DO NOTHING`.
- Executed via `ensureOnboardedUser()` after user authentication.
