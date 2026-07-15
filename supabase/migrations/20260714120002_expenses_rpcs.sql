-- =============================================================================
-- Migration: expenses_rpcs
-- Purpose: Atomic create/update for expenses with equal split shares.
-- =============================================================================

-- Distributes amount in cents evenly; remainder pennies go to the first N participants.
CREATE OR REPLACE FUNCTION public.calculate_equal_shares(
  p_amount NUMERIC,
  p_participant_ids UUID[]
)
RETURNS TABLE (user_id UUID, share_amount NUMERIC)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_count INTEGER;
  v_total_cents BIGINT;
  v_base_cents BIGINT;
  v_remainder INTEGER;
  v_index INTEGER := 0;
  v_participant_id UUID;
BEGIN
  v_count := COALESCE(array_length(p_participant_ids, 1), 0);

  IF v_count <= 0 THEN
    RAISE EXCEPTION 'At least one participant is required' USING ERRCODE = '22023';
  END IF;

  v_total_cents := ROUND(p_amount * 100);
  v_base_cents := v_total_cents / v_count;
  v_remainder := (v_total_cents % v_count)::INTEGER;

  FOREACH v_participant_id IN ARRAY p_participant_ids LOOP
    v_index := v_index + 1;
    user_id := v_participant_id;
    share_amount := (v_base_cents + CASE WHEN v_index <= v_remainder THEN 1 ELSE 0 END) / 100.0;
    RETURN NEXT;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_expense(
  p_group_id UUID,
  p_title TEXT,
  p_amount NUMERIC,
  p_paid_by UUID,
  p_participant_ids UUID[],
  p_notes TEXT DEFAULT NULL
)
RETURNS public.expenses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_expense public.expenses;
  v_participant_id UUID;
  v_share RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_group_member(p_group_id, v_user_id) THEN
    RAISE EXCEPTION 'You do not have access to this group' USING ERRCODE = '42501';
  END IF;

  IF char_length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'Expense title is required' USING ERRCODE = '22023';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero' USING ERRCODE = '22023';
  END IF;

  IF p_participant_ids IS NULL OR COALESCE(array_length(p_participant_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'At least one participant is required' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_group_member(p_group_id, p_paid_by) THEN
    RAISE EXCEPTION 'Payer must be a member of the group' USING ERRCODE = '22023';
  END IF;

  FOREACH v_participant_id IN ARRAY p_participant_ids LOOP
    IF NOT public.is_group_member(p_group_id, v_participant_id) THEN
      RAISE EXCEPTION 'All participants must be members of the group' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  INSERT INTO public.expenses (
    group_id,
    title,
    amount,
    paid_by,
    notes,
    split_type,
    created_by
  )
  VALUES (
    p_group_id,
    trim(p_title),
    ROUND(p_amount, 2),
    p_paid_by,
    NULLIF(trim(p_notes), ''),
    'equal',
    v_user_id
  )
  RETURNING * INTO v_expense;

  FOR v_share IN
    SELECT * FROM public.calculate_equal_shares(v_expense.amount, p_participant_ids)
  LOOP
    INSERT INTO public.expense_participants (expense_id, user_id, share_amount)
    VALUES (v_expense.id, v_share.user_id, v_share.share_amount);
  END LOOP;

  RETURN v_expense;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_expense(
  p_expense_id UUID,
  p_title TEXT,
  p_amount NUMERIC,
  p_paid_by UUID,
  p_participant_ids UUID[],
  p_notes TEXT DEFAULT NULL
)
RETURNS public.expenses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_expense public.expenses;
  v_participant_id UUID;
  v_share RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT *
  INTO v_expense
  FROM public.expenses e
  WHERE e.id = p_expense_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Expense not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.is_group_member(v_expense.group_id, v_user_id) THEN
    RAISE EXCEPTION 'You do not have access to this expense' USING ERRCODE = '42501';
  END IF;

  IF char_length(trim(p_title)) = 0 THEN
    RAISE EXCEPTION 'Expense title is required' USING ERRCODE = '22023';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero' USING ERRCODE = '22023';
  END IF;

  IF p_participant_ids IS NULL OR COALESCE(array_length(p_participant_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'At least one participant is required' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_group_member(v_expense.group_id, p_paid_by) THEN
    RAISE EXCEPTION 'Payer must be a member of the group' USING ERRCODE = '22023';
  END IF;

  FOREACH v_participant_id IN ARRAY p_participant_ids LOOP
    IF NOT public.is_group_member(v_expense.group_id, v_participant_id) THEN
      RAISE EXCEPTION 'All participants must be members of the group' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  UPDATE public.expenses
  SET
    title = trim(p_title),
    amount = ROUND(p_amount, 2),
    paid_by = p_paid_by,
    notes = NULLIF(trim(p_notes), ''),
    split_type = 'equal',
    updated_at = NOW()
  WHERE id = p_expense_id
  RETURNING * INTO v_expense;

  DELETE FROM public.expense_participants
  WHERE expense_id = p_expense_id;

  FOR v_share IN
    SELECT * FROM public.calculate_equal_shares(v_expense.amount, p_participant_ids)
  LOOP
    INSERT INTO public.expense_participants (expense_id, user_id, share_amount)
    VALUES (v_expense.id, v_share.user_id, v_share.share_amount);
  END LOOP;

  RETURN v_expense;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_equal_shares(NUMERIC, UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_expense(UUID, TEXT, NUMERIC, UUID, UUID[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_expense(UUID, TEXT, NUMERIC, UUID, UUID[], TEXT) TO authenticated;
