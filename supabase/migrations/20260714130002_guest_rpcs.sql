-- =============================================================================
-- Migration: guest_rpcs
-- Purpose: Helpers and RPCs for name-only guests in groups and expenses.
-- =============================================================================

-- True when the guest belongs to the group.
CREATE OR REPLACE FUNCTION public.is_group_guest(
  p_group_id UUID,
  p_guest_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_guests gg
    WHERE gg.group_id = p_group_id
      AND gg.id = p_guest_id
  );
$$;

-- True when the id is a registered member or a name-only guest in the group.
CREATE OR REPLACE FUNCTION public.is_group_participant(
  p_group_id UUID,
  p_participant_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_group_member(p_group_id, p_participant_id)
    OR public.is_group_guest(p_group_id, p_participant_id);
$$;

-- Adds a name-only guest to a group. Any group member may add guests.
CREATE OR REPLACE FUNCTION public.add_group_guest_by_name(
  p_group_id UUID,
  p_name TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_display_name TEXT;
  v_guest_id UUID;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_group_member(p_group_id, v_caller_id) THEN
    RAISE EXCEPTION 'You do not have access to this group' USING ERRCODE = '42501';
  END IF;

  v_display_name := trim(p_name);

  IF v_display_name IS NULL OR char_length(v_display_name) = 0 THEN
    RAISE EXCEPTION 'Name is required' USING ERRCODE = '22023';
  END IF;

  IF char_length(v_display_name) > 80 THEN
    RAISE EXCEPTION 'Name must be 80 characters or less' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.group_guests gg
    WHERE gg.group_id = p_group_id
      AND lower(trim(gg.display_name)) = lower(v_display_name)
  ) THEN
    RAISE EXCEPTION 'A person with this name already exists in the group' USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.group_members gm
    JOIN public.profiles p ON p.id = gm.user_id
    WHERE gm.group_id = p_group_id
      AND lower(trim(p.full_name)) = lower(v_display_name)
  ) THEN
    RAISE EXCEPTION 'A member with this name already exists in the group' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.group_guests (group_id, display_name, created_by)
  VALUES (p_group_id, v_display_name, v_caller_id)
  RETURNING id INTO v_guest_id;

  RETURN v_guest_id;
END;
$$;

COMMENT ON FUNCTION public.add_group_guest_by_name(UUID, TEXT) IS
  'Adds a name-only guest to a group. Any group member may add guests.';

GRANT EXECUTE ON FUNCTION public.is_group_guest(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_participant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_group_guest_by_name(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Update expense RPCs to support guests as payers and participants
-- ---------------------------------------------------------------------------

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
  v_paid_by_user UUID;
  v_paid_by_guest UUID;
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

  IF public.is_group_member(p_group_id, p_paid_by) THEN
    v_paid_by_user := p_paid_by;
  ELSIF public.is_group_guest(p_group_id, p_paid_by) THEN
    v_paid_by_guest := p_paid_by;
  ELSE
    RAISE EXCEPTION 'Payer must be a group member or guest' USING ERRCODE = '22023';
  END IF;

  FOREACH v_participant_id IN ARRAY p_participant_ids LOOP
    IF NOT public.is_group_participant(p_group_id, v_participant_id) THEN
      RAISE EXCEPTION 'All participants must be members or guests of the group' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  INSERT INTO public.expenses (
    group_id,
    title,
    amount,
    paid_by,
    paid_by_guest_id,
    notes,
    split_type,
    created_by
  )
  VALUES (
    p_group_id,
    trim(p_title),
    ROUND(p_amount, 2),
    v_paid_by_user,
    v_paid_by_guest,
    NULLIF(trim(p_notes), ''),
    'equal',
    v_user_id
  )
  RETURNING * INTO v_expense;

  FOR v_share IN
    SELECT * FROM public.calculate_equal_shares(v_expense.amount, p_participant_ids)
  LOOP
    IF public.is_group_member(p_group_id, v_share.user_id) THEN
      INSERT INTO public.expense_participants (expense_id, user_id, share_amount)
      VALUES (v_expense.id, v_share.user_id, v_share.share_amount);
    ELSIF public.is_group_guest(p_group_id, v_share.user_id) THEN
      INSERT INTO public.expense_participants (expense_id, guest_id, share_amount)
      VALUES (v_expense.id, v_share.user_id, v_share.share_amount);
    END IF;
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
  v_paid_by_user UUID;
  v_paid_by_guest UUID;
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

  IF public.is_group_member(v_expense.group_id, p_paid_by) THEN
    v_paid_by_user := p_paid_by;
  ELSIF public.is_group_guest(v_expense.group_id, p_paid_by) THEN
    v_paid_by_guest := p_paid_by;
  ELSE
    RAISE EXCEPTION 'Payer must be a group member or guest' USING ERRCODE = '22023';
  END IF;

  FOREACH v_participant_id IN ARRAY p_participant_ids LOOP
    IF NOT public.is_group_participant(v_expense.group_id, v_participant_id) THEN
      RAISE EXCEPTION 'All participants must be members or guests of the group' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  UPDATE public.expenses
  SET
    title = trim(p_title),
    amount = ROUND(p_amount, 2),
    paid_by = v_paid_by_user,
    paid_by_guest_id = v_paid_by_guest,
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
    IF public.is_group_member(v_expense.group_id, v_share.user_id) THEN
      INSERT INTO public.expense_participants (expense_id, user_id, share_amount)
      VALUES (v_expense.id, v_share.user_id, v_share.share_amount);
    ELSIF public.is_group_guest(v_expense.group_id, v_share.user_id) THEN
      INSERT INTO public.expense_participants (expense_id, guest_id, share_amount)
      VALUES (v_expense.id, v_share.user_id, v_share.share_amount);
    END IF;
  END LOOP;

  RETURN v_expense;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_expense(UUID, TEXT, NUMERIC, UUID, UUID[], TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_expense(UUID, TEXT, NUMERIC, UUID, UUID[], TEXT) TO authenticated;
