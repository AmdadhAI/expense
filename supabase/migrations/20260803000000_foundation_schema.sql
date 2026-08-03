-- 2026 Budget Tracker Foundation Migration
-- 1. Create Tables

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  currency text NOT NULL DEFAULT 'BDT',
  timezone text NOT NULL DEFAULT 'Asia/Dhaka',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('income', 'expense', 'saving')),
  default_bucket text CHECK (default_bucket IN ('needs', 'wants', 'savings') OR default_bucket IS NULL),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT categories_composite_key UNIQUE (id, user_id, kind)
);

-- Case-insensitive unique index per user and kind
CREATE UNIQUE INDEX IF NOT EXISTS categories_user_name_kind_idx ON public.categories (user_id, lower(name), kind);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('income', 'expense', 'saving')),
  amount_poisha bigint NOT NULL CHECK (amount_poisha > 0),
  description text NOT NULL,
  transaction_date date NOT NULL,
  category_id uuid NOT NULL,
  bucket text CHECK (bucket IN ('needs', 'wants', 'savings') OR bucket IS NULL),
  note text,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transactions_kind_bucket_check CHECK (
    (kind = 'income' AND bucket IS NULL) OR
    (kind = 'expense' AND bucket IN ('needs', 'wants')) OR
    (kind = 'saving' AND bucket = 'savings')
  ),
  CONSTRAINT transactions_category_composite_fk FOREIGN KEY (category_id, user_id, kind)
    REFERENCES public.categories(id, user_id, kind) ON DELETE RESTRICT
);

-- Idempotency unique index for transactions (user_id, request_id)
CREATE UNIQUE INDEX IF NOT EXISTS transactions_user_request_id_idx ON public.transactions (user_id, request_id) WHERE request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.budget_plans (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year smallint NOT NULL,
  needs_bp integer NOT NULL CHECK (needs_bp BETWEEN 0 AND 10000),
  wants_bp integer NOT NULL CHECK (wants_bp BETWEEN 0 AND 10000),
  savings_bp integer NOT NULL CHECK (savings_bp BETWEEN 0 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, year),
  CONSTRAINT budget_plans_bp_sum CHECK (needs_bp + wants_bp + savings_bp = 10000)
);

CREATE TABLE IF NOT EXISTS public.monthly_notes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year smallint NOT NULL,
  month smallint NOT NULL CHECK (month BETWEEN 1 AND 12),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, year, month)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_kind_date ON public.transactions(user_id, kind, transaction_date DESC);

-- 2. Explicit Revoke & Table Grants
REVOKE ALL ON TABLE public.profiles, public.categories, public.transactions, public.budget_plans, public.monthly_notes FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles, public.categories, public.transactions, public.budget_plans, public.monthly_notes TO authenticated;

-- 3. Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_notes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY profiles_delete ON public.profiles FOR DELETE TO authenticated USING ((SELECT auth.uid()) = id);

-- Categories Policies
CREATE POLICY categories_select ON public.categories FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY categories_insert ON public.categories FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY categories_update ON public.categories FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY categories_delete ON public.categories FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Transactions Policies
CREATE POLICY transactions_select ON public.transactions FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY transactions_insert ON public.transactions FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY transactions_update ON public.transactions FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY transactions_delete ON public.transactions FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Budget Plans Policies
CREATE POLICY budget_plans_select ON public.budget_plans FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY budget_plans_insert ON public.budget_plans FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY budget_plans_update ON public.budget_plans FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY budget_plans_delete ON public.budget_plans FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Monthly Notes Policies
CREATE POLICY monthly_notes_select ON public.monthly_notes FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE POLICY monthly_notes_insert ON public.monthly_notes FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY monthly_notes_update ON public.monthly_notes FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY monthly_notes_delete ON public.monthly_notes FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- 4. Transactional Onboarding SECURITY INVOKER Function
CREATE OR REPLACE FUNCTION public.onboard_user()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required for onboarding';
  END IF;

  -- Profile
  INSERT INTO public.profiles (id, currency, timezone)
  VALUES (v_user_id, 'BDT', 'Asia/Dhaka')
  ON CONFLICT (id) DO NOTHING;

  -- 2026 Budget Plan (Needs: 2000 bp / 20%, Wants: 1000 bp / 10%, Savings: 7000 bp / 70%)
  INSERT INTO public.budget_plans (user_id, year, needs_bp, wants_bp, savings_bp)
  VALUES (v_user_id, 2026, 2000, 1000, 7000)
  ON CONFLICT (user_id, year) DO NOTHING;

  -- Generic Starter Categories (No Investment, No Salary)
  INSERT INTO public.categories (user_id, name, kind, default_bucket) VALUES
    (v_user_id, 'Rent', 'expense', 'needs'),
    (v_user_id, 'Food', 'expense', 'needs'),
    (v_user_id, 'Utilities', 'expense', 'needs'),
    (v_user_id, 'Dining', 'expense', 'wants'),
    (v_user_id, 'Entertainment', 'expense', 'wants'),
    (v_user_id, 'Emergency Fund', 'saving', 'savings'),
    (v_user_id, 'General Savings', 'saving', 'savings'),
    (v_user_id, 'Generic Income', 'income', NULL)
  ON CONFLICT (user_id, lower(name), kind) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.onboard_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.onboard_user() TO authenticated;
