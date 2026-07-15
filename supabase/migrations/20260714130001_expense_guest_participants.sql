-- =============================================================================
-- Migration: expense_guest_participants
-- Purpose: Allow expenses and participants to reference group guests.
-- =============================================================================

ALTER TABLE public.expenses
  ALTER COLUMN paid_by DROP NOT NULL;

ALTER TABLE public.expenses
  ADD COLUMN paid_by_guest_id UUID REFERENCES public.group_guests(id);

ALTER TABLE public.expenses
  ADD CONSTRAINT expenses_payer_check CHECK (
    (paid_by IS NOT NULL AND paid_by_guest_id IS NULL)
    OR (paid_by IS NULL AND paid_by_guest_id IS NOT NULL)
  );

CREATE INDEX expenses_paid_by_guest_id_idx
  ON public.expenses (paid_by_guest_id);

ALTER TABLE public.expense_participants
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.expense_participants
  ADD COLUMN guest_id UUID REFERENCES public.group_guests(id);

ALTER TABLE public.expense_participants
  DROP CONSTRAINT expense_participants_expense_user_unique;

ALTER TABLE public.expense_participants
  ADD CONSTRAINT expense_participants_participant_check CHECK (
    (user_id IS NOT NULL AND guest_id IS NULL)
    OR (user_id IS NULL AND guest_id IS NOT NULL)
  );

CREATE UNIQUE INDEX expense_participants_expense_user_unique
  ON public.expense_participants (expense_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX expense_participants_expense_guest_unique
  ON public.expense_participants (expense_id, guest_id)
  WHERE guest_id IS NOT NULL;

CREATE INDEX expense_participants_guest_id_idx
  ON public.expense_participants (guest_id);
