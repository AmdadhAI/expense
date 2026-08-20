-- Migration: Person-Centric Dena-Paona (Lend & Borrow) Schema
-- Created: 2026-08-20

-- 1. Contacts table (People you have Dena / Paona relations with)
CREATE TABLE IF NOT EXISTS public.debt_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive unique constraint per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_debt_contacts_user_name ON public.debt_contacts (user_id, lower(trim(name)));

-- 2. Ledger entries table (Individual transactions & payments)
CREATE TABLE IF NOT EXISTS public.debt_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.debt_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('gave', 'took', 'received', 'paid')),
  amount_poisha BIGINT NOT NULL CHECK (amount_poisha > 0),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debt_entries_contact ON public.debt_entries (contact_id, user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_debt_entries_user_type ON public.debt_entries (user_id, entry_type);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.debt_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'debt_contacts' AND policyname = 'debt_contacts_owner_all') THEN
    CREATE POLICY debt_contacts_owner_all ON public.debt_contacts
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'debt_entries' AND policyname = 'debt_entries_owner_all') THEN
    CREATE POLICY debt_entries_owner_all ON public.debt_entries
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Safe migration of legacy debts & payments data if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debts') THEN
    -- Insert unique contacts from legacy debts
    INSERT INTO public.debt_contacts (user_id, name, created_at, updated_at)
    SELECT DISTINCT user_id, trim(person_name), min(created_at), now()
    FROM public.debts
    GROUP BY user_id, trim(person_name)
    ON CONFLICT (user_id, lower(trim(name))) DO NOTHING;

    -- Migrate initial debts into debt_entries
    INSERT INTO public.debt_entries (id, contact_id, user_id, entry_type, amount_poisha, entry_date, due_date, notes, created_at)
    SELECT 
      d.id,
      c.id,
      d.user_id,
      CASE WHEN d.type = 'lent' THEN 'gave' ELSE 'took' END,
      d.amount_poisha,
      d.created_at::date,
      d.due_date,
      d.notes,
      d.created_at
    FROM public.debts d
    JOIN public.debt_contacts c ON c.user_id = d.user_id AND lower(trim(c.name)) = lower(trim(d.person_name))
    ON CONFLICT (id) DO NOTHING;

    -- Migrate legacy payments into debt_entries
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'debt_payments') THEN
      INSERT INTO public.debt_entries (id, contact_id, user_id, entry_type, amount_poisha, entry_date, notes, created_at)
      SELECT 
        dp.id,
        c.id,
        dp.user_id,
        CASE WHEN d.type = 'lent' THEN 'received' ELSE 'paid' END,
        dp.amount_poisha,
        dp.payment_date,
        dp.notes,
        dp.created_at
      FROM public.debt_payments dp
      JOIN public.debts d ON d.id = dp.debt_id
      JOIN public.debt_contacts c ON c.user_id = d.user_id AND lower(trim(c.name)) = lower(trim(d.person_name))
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END $$;
