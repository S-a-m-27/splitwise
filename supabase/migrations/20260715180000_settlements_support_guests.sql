-- =============================================================================
-- Migration: settlements_support_guests
-- Purpose: Allow settlements between registered members and name-only guests.
-- =============================================================================

ALTER TABLE public.settlements
  ALTER COLUMN from_user_id DROP NOT NULL,
  ALTER COLUMN to_user_id DROP NOT NULL;

ALTER TABLE public.settlements
  ADD COLUMN IF NOT EXISTS from_guest_id UUID REFERENCES public.group_guests(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS to_guest_id UUID REFERENCES public.group_guests(id) ON DELETE CASCADE;

ALTER TABLE public.settlements
  DROP CONSTRAINT IF EXISTS settlements_different_users;

ALTER TABLE public.settlements
  ADD CONSTRAINT settlements_from_party_check CHECK (
    (from_user_id IS NOT NULL AND from_guest_id IS NULL)
    OR (from_user_id IS NULL AND from_guest_id IS NOT NULL)
  ),
  ADD CONSTRAINT settlements_to_party_check CHECK (
    (to_user_id IS NOT NULL AND to_guest_id IS NULL)
    OR (to_user_id IS NULL AND to_guest_id IS NOT NULL)
  ),
  ADD CONSTRAINT settlements_different_parties CHECK (
    COALESCE(from_user_id, from_guest_id) <> COALESCE(to_user_id, to_guest_id)
  );

COMMENT ON COLUMN public.settlements.from_guest_id IS
  'Name-only guest payer when from_user_id is null.';
COMMENT ON COLUMN public.settlements.to_guest_id IS
  'Name-only guest receiver when to_user_id is null.';

DROP FUNCTION IF EXISTS public.create_settlement(UUID, UUID, UUID, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION public.create_settlement(
  p_group_id UUID,
  p_from_participant_id UUID,
  p_to_participant_id UUID,
  p_amount NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.settlements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_settlement public.settlements;
  v_from_user_id UUID;
  v_from_guest_id UUID;
  v_to_user_id UUID;
  v_to_guest_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_group_member(p_group_id, v_user_id) THEN
    RAISE EXCEPTION 'You do not have access to this group' USING ERRCODE = '42501';
  END IF;

  IF p_from_participant_id = p_to_participant_id THEN
    RAISE EXCEPTION 'Payer and receiver must be different people' USING ERRCODE = '22023';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_group_participant(p_group_id, p_from_participant_id) THEN
    RAISE EXCEPTION 'Payer must be a member or guest of the group' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_group_participant(p_group_id, p_to_participant_id) THEN
    RAISE EXCEPTION 'Receiver must be a member or guest of the group' USING ERRCODE = '22023';
  END IF;

  IF public.is_group_member(p_group_id, p_from_participant_id) THEN
    v_from_user_id := p_from_participant_id;
  ELSE
    v_from_guest_id := p_from_participant_id;
  END IF;

  IF public.is_group_member(p_group_id, p_to_participant_id) THEN
    v_to_user_id := p_to_participant_id;
  ELSE
    v_to_guest_id := p_to_participant_id;
  END IF;

  INSERT INTO public.settlements (
    group_id,
    from_user_id,
    from_guest_id,
    to_user_id,
    to_guest_id,
    amount,
    notes,
    created_by
  )
  VALUES (
    p_group_id,
    v_from_user_id,
    v_from_guest_id,
    v_to_user_id,
    v_to_guest_id,
    ROUND(p_amount, 2),
    NULLIF(trim(p_notes), ''),
    v_user_id
  )
  RETURNING * INTO v_settlement;

  RETURN v_settlement;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_settlement(UUID, UUID, UUID, NUMERIC, TEXT) TO authenticated;
