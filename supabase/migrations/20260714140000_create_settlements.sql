-- =============================================================================
-- Migration: create_settlements
-- Purpose: Record payments between group members to settle balances.
-- =============================================================================

CREATE TABLE public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id),
  to_user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT settlements_different_users CHECK (from_user_id <> to_user_id)
);

CREATE INDEX settlements_group_id_created_at_idx
  ON public.settlements (group_id, created_at DESC);

CREATE INDEX settlements_from_user_id_idx
  ON public.settlements (from_user_id);

CREATE INDEX settlements_to_user_id_idx
  ON public.settlements (to_user_id);

COMMENT ON TABLE public.settlements IS
  'Payments recorded between registered group members to settle outstanding balances.';
