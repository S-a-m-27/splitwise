-- =============================================================================
-- Migration: settlements_rpcs
-- Purpose: Atomic settlement creation with group membership validation.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.create_settlement(
  p_group_id UUID,
  p_from_user_id UUID,
  p_to_user_id UUID,
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
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_group_member(p_group_id, v_user_id) THEN
    RAISE EXCEPTION 'You do not have access to this group' USING ERRCODE = '42501';
  END IF;

  IF p_from_user_id = p_to_user_id THEN
    RAISE EXCEPTION 'Payer and receiver must be different people' USING ERRCODE = '22023';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_group_member(p_group_id, p_from_user_id) THEN
    RAISE EXCEPTION 'Payer must be a member of the group' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_group_member(p_group_id, p_to_user_id) THEN
    RAISE EXCEPTION 'Receiver must be a member of the group' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.settlements (
    group_id,
    from_user_id,
    to_user_id,
    amount,
    notes,
    created_by
  )
  VALUES (
    p_group_id,
    p_from_user_id,
    p_to_user_id,
    ROUND(p_amount, 2),
    NULLIF(trim(p_notes), ''),
    v_user_id
  )
  RETURNING * INTO v_settlement;

  RETURN v_settlement;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_settlement(UUID, UUID, UUID, NUMERIC, TEXT) TO authenticated;
