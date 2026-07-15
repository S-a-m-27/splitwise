-- =============================================================================
-- Migration: create_expense_participants
-- Purpose: Per-user share amounts for each expense.
-- =============================================================================

CREATE TABLE public.expense_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  share_amount NUMERIC(12, 2) NOT NULL CHECK (share_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT expense_participants_expense_user_unique UNIQUE (expense_id, user_id)
);

CREATE INDEX expense_participants_expense_id_idx
  ON public.expense_participants (expense_id);

CREATE INDEX expense_participants_user_id_idx
  ON public.expense_participants (user_id);
