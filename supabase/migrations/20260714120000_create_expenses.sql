-- =============================================================================
-- Migration: create_expenses
-- Purpose: Expenses table for group-shared costs (equal split MVP).
-- =============================================================================

CREATE TYPE public.expense_split_type AS ENUM ('equal');

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  paid_by UUID NOT NULL REFERENCES public.profiles(id),
  notes TEXT,
  split_type public.expense_split_type NOT NULL DEFAULT 'equal',
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX expenses_group_id_created_at_idx
  ON public.expenses (group_id, created_at DESC);

CREATE INDEX expenses_paid_by_idx
  ON public.expenses (paid_by);

CREATE TRIGGER expenses_set_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
