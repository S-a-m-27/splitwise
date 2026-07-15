-- =============================================================================
-- Migration: groups_helpers
-- Purpose: Shared helper functions and RPCs for group operations.
-- =============================================================================

-- Generates a URL-safe invite code (12 hex chars).
-- Uses gen_random_uuid() — no pgcrypto extension required.
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE sql
VOLATILE
AS $$
  SELECT substring(replace(gen_random_uuid()::text, '-', ''), 1, 12);
$$;

-- True when the user is a member of the group.
CREATE OR REPLACE FUNCTION public.is_group_member(
  p_group_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = p_user_id
  );
$$;

-- True when the user is the owner of the group.
CREATE OR REPLACE FUNCTION public.is_group_owner(
  p_group_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = p_user_id
      AND gm.role = 'owner'
  );
$$;

-- Creates a group, adds the creator as owner, and seeds the active invitation.
CREATE OR REPLACE FUNCTION public.create_group(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT '🎉',
  p_type public.group_type DEFAULT 'other'
)
RETURNS public.groups
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_invite_code TEXT;
  v_group public.groups;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF char_length(trim(p_name)) = 0 THEN
    RAISE EXCEPTION 'Group name is required' USING ERRCODE = '22023';
  END IF;

  v_invite_code := public.generate_invite_code();
  WHILE EXISTS (SELECT 1 FROM public.groups WHERE invite_code = v_invite_code) LOOP
    v_invite_code := public.generate_invite_code();
  END LOOP;

  INSERT INTO public.groups (name, description, icon, type, invite_code, created_by)
  VALUES (
    trim(p_name),
    NULLIF(trim(p_description), ''),
    COALESCE(NULLIF(trim(p_icon), ''), '🎉'),
    COALESCE(p_type, 'other'),
    v_invite_code,
    v_user_id
  )
  RETURNING * INTO v_group;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group.id, v_user_id, 'owner');

  INSERT INTO public.group_invitations (group_id, invite_code, created_by, active)
  VALUES (v_group.id, v_invite_code, v_user_id, TRUE);

  RETURN v_group;
END;
$$;

-- Joins the authenticated user to a group via an active invite code.
CREATE OR REPLACE FUNCTION public.join_group_by_invite(p_invite_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_group_id UUID;
  v_invitation_id UUID;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_invite_code IS NULL OR char_length(trim(p_invite_code)) = 0 THEN
    RAISE EXCEPTION 'Invalid invite code' USING ERRCODE = '22023';
  END IF;

  SELECT gi.id, gi.group_id, gi.expires_at
  INTO v_invitation_id, v_group_id, v_expires_at
  FROM public.group_invitations gi
  WHERE gi.invite_code = trim(p_invite_code)
    AND gi.active = TRUE
  LIMIT 1;

  IF v_invitation_id IS NULL THEN
    -- Fallback to groups.invite_code for legacy links
    SELECT g.id
    INTO v_group_id
    FROM public.groups g
    WHERE g.invite_code = trim(p_invite_code)
    LIMIT 1;

    IF v_group_id IS NULL THEN
      RAISE EXCEPTION 'Invite link is invalid or has expired' USING ERRCODE = '22023';
    END IF;
  ELSIF v_expires_at IS NOT NULL AND v_expires_at < NOW() THEN
    RAISE EXCEPTION 'Invite link has expired' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = v_group_id
      AND gm.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You are already a member of this group' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, v_user_id, 'member');

  RETURN v_group_id;
END;
$$;

-- Regenerates the active invite link for a group (owner only).
CREATE OR REPLACE FUNCTION public.regenerate_group_invite(p_group_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_invite_code TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_group_owner(p_group_id, v_user_id) THEN
    RAISE EXCEPTION 'Only the group owner can regenerate invites' USING ERRCODE = '42501';
  END IF;

  v_invite_code := public.generate_invite_code();
  WHILE EXISTS (
    SELECT 1 FROM public.group_invitations WHERE invite_code = v_invite_code
    UNION ALL
    SELECT 1 FROM public.groups WHERE invite_code = v_invite_code
  ) LOOP
    v_invite_code := public.generate_invite_code();
  END LOOP;

  UPDATE public.group_invitations
  SET active = FALSE
  WHERE group_id = p_group_id
    AND active = TRUE;

  INSERT INTO public.group_invitations (group_id, invite_code, created_by, active)
  VALUES (p_group_id, v_invite_code, v_user_id, TRUE);

  UPDATE public.groups
  SET invite_code = v_invite_code
  WHERE id = p_group_id;

  RETURN v_invite_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group(TEXT, TEXT, TEXT, public.group_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group_by_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_group_invite(UUID) TO authenticated;
