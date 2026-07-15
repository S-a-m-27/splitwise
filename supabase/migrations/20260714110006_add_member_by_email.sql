-- =============================================================================
-- Migration: add_member_by_email
-- Purpose: Allow group owners to add registered users by email (no email verification).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.add_group_member_by_email(
  p_group_id UUID,
  p_email TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_caller_id UUID := auth.uid();
  v_normalized_email TEXT;
  v_target_user_id UUID;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_group_owner(p_group_id, v_caller_id) THEN
    RAISE EXCEPTION 'Only the group owner can add members' USING ERRCODE = '42501';
  END IF;

  v_normalized_email := lower(trim(p_email));

  IF v_normalized_email IS NULL OR char_length(v_normalized_email) = 0 THEN
    RAISE EXCEPTION 'Email is required' USING ERRCODE = '22023';
  END IF;

  IF v_normalized_email !~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$' THEN
    RAISE EXCEPTION 'Please enter a valid email address' USING ERRCODE = '22023';
  END IF;

  SELECT au.id
  INTO v_target_user_id
  FROM auth.users au
  WHERE lower(au.email) = v_normalized_email
  LIMIT 1;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'No registered account found with this email' USING ERRCODE = '22023';
  END IF;

  IF v_target_user_id = v_caller_id THEN
    RAISE EXCEPTION 'You are already a member of this group' USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = v_target_user_id
  ) THEN
    RAISE EXCEPTION 'This user is already a member of the group' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (p_group_id, v_target_user_id, 'member');

  RETURN v_target_user_id;
END;
$$;

COMMENT ON FUNCTION public.add_group_member_by_email(UUID, TEXT) IS
  'Adds a registered app user to a group by email. Owner only. No outbound email is sent.';

GRANT EXECUTE ON FUNCTION public.add_group_member_by_email(UUID, TEXT) TO authenticated;
