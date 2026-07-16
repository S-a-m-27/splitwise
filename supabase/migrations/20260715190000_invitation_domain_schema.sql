-- =============================================================================
-- Migration: invitation_domain_schema
-- Purpose: Extend group_invitations into a unified invitation entity supporting
--          share-link delivery (legacy) and member invitations (lifecycle).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.invitation_kind AS ENUM (
  'share_link',
  'member'
);

CREATE TYPE public.invitation_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'expired',
  'cancelled'
);

CREATE TYPE public.invitation_delivery_channel AS ENUM (
  'email',
  'in_app',
  'push',
  'sms',
  'whatsapp',
  'qr_code',
  'share_link'
);

CREATE TYPE public.invitation_accepted_via AS ENUM (
  'email',
  'application',
  'share_link'
);

COMMENT ON TYPE public.invitation_kind IS
  'share_link = reusable group link; member = directed invitation to one person.';
COMMENT ON TYPE public.invitation_delivery_channel IS
  'Delivery mechanisms only — they do not define invitation lifecycle state.';

-- ---------------------------------------------------------------------------
-- Extend group_invitations
-- ---------------------------------------------------------------------------

ALTER TABLE public.group_invitations
  ADD COLUMN IF NOT EXISTS kind public.invitation_kind NOT NULL DEFAULT 'share_link',
  ADD COLUMN IF NOT EXISTS status public.invitation_status,
  ADD COLUMN IF NOT EXISTS invited_email TEXT,
  ADD COLUMN IF NOT EXISTS invited_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_channels public.invitation_delivery_channel[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS accepted_via public.invitation_accepted_via,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Share-link rows keep invite_code; member rows may also carry a unique deep-link code.
ALTER TABLE public.group_invitations
  ALTER COLUMN invite_code DROP NOT NULL;

-- Backfill existing share-link rows.
UPDATE public.group_invitations
SET
  kind = 'share_link',
  delivery_channels = ARRAY['share_link']::public.invitation_delivery_channel[]
WHERE kind = 'share_link'
  AND invited_email IS NULL
  AND invited_user_id IS NULL
  AND status IS NULL;

ALTER TABLE public.group_invitations
  ADD CONSTRAINT group_invitations_share_link_shape CHECK (
    kind <> 'share_link'
    OR (
      invite_code IS NOT NULL
      AND invited_email IS NULL
      AND invited_user_id IS NULL
      AND status IS NULL
    )
  ),
  ADD CONSTRAINT group_invitations_member_shape CHECK (
    kind <> 'member'
    OR (
      status IS NOT NULL
      AND invited_email IS NOT NULL
      AND char_length(trim(invited_email)) > 0
    )
  ),
  ADD CONSTRAINT group_invitations_member_terminal_status CHECK (
    kind <> 'member'
    OR status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')
  ),
  ADD CONSTRAINT group_invitations_invited_email_normalized CHECK (
    invited_email IS NULL
    OR invited_email = lower(trim(invited_email))
  );

COMMENT ON COLUMN public.group_invitations.invited_email IS
  'Normalized lowercase email for member invitations.';
COMMENT ON COLUMN public.group_invitations.invited_user_id IS
  'Linked registered user; nullable until the invitee signs up.';
COMMENT ON COLUMN public.group_invitations.metadata IS
  'Extensible JSON for future channels (SMS template ids, campaign refs, etc.).';

-- Replace share-link uniqueness to scope by kind.
DROP INDEX IF EXISTS public.group_invitations_one_active_per_group;

CREATE UNIQUE INDEX group_invitations_one_active_share_link_per_group
  ON public.group_invitations (group_id)
  WHERE kind = 'share_link' AND active = TRUE;

CREATE UNIQUE INDEX group_invitations_one_pending_per_email
  ON public.group_invitations (group_id, invited_email)
  WHERE kind = 'member' AND status = 'pending' AND invited_email IS NOT NULL;

CREATE UNIQUE INDEX group_invitations_one_pending_per_user
  ON public.group_invitations (group_id, invited_user_id)
  WHERE kind = 'member' AND status = 'pending' AND invited_user_id IS NOT NULL;

CREATE INDEX group_invitations_member_status_idx
  ON public.group_invitations (status)
  WHERE kind = 'member';

CREATE INDEX group_invitations_invited_user_id_idx
  ON public.group_invitations (invited_user_id)
  WHERE kind = 'member';

CREATE INDEX group_invitations_invited_email_idx
  ON public.group_invitations (invited_email)
  WHERE kind = 'member';

CREATE INDEX group_invitations_kind_group_id_idx
  ON public.group_invitations (kind, group_id);

CREATE TRIGGER group_invitations_set_updated_at
  BEFORE UPDATE ON public.group_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_group_admin_or_owner(
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
      AND gm.role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.normalize_invitation_email(p_email TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT lower(trim(p_email));
$$;

CREATE OR REPLACE FUNCTION public.is_valid_invitation_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT public.normalize_invitation_email(p_email) ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$';
$$;

CREATE OR REPLACE FUNCTION public.is_invitation_recipient(
  p_invited_user_id UUID,
  p_invited_email TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_email TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF p_invited_user_id IS NOT NULL AND p_invited_user_id = p_user_id THEN
    RETURN TRUE;
  END IF;

  IF p_invited_email IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT lower(au.email)
  INTO v_auth_email
  FROM auth.users au
  WHERE au.id = p_user_id;

  RETURN v_auth_email IS NOT NULL
    AND public.normalize_invitation_email(p_invited_email) = v_auth_email;
END;
$$;

CREATE OR REPLACE FUNCTION public.assert_member_invitation_pending(
  p_invitation public.group_invitations
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_invitation.kind <> 'member' THEN
    RAISE EXCEPTION 'Invitation is not a member invitation' USING ERRCODE = '22023';
  END IF;

  IF p_invitation.status <> 'pending' THEN
    RAISE EXCEPTION 'Invitation is not pending' USING ERRCODE = '22023';
  END IF;

  IF p_invitation.expires_at IS NOT NULL AND p_invitation.expires_at < NOW() THEN
    RAISE EXCEPTION 'Invitation has expired' USING ERRCODE = '22023';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Link pending invitations when a user registers (no membership side effects)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.link_pending_invitations_to_user(
  p_user_id UUID,
  p_email TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_normalized_email TEXT;
  v_updated_count INTEGER;
BEGIN
  v_normalized_email := public.normalize_invitation_email(p_email);

  IF v_normalized_email IS NULL OR char_length(v_normalized_email) = 0 THEN
    RETURN 0;
  END IF;

  UPDATE public.group_invitations gi
  SET
    invited_user_id = p_user_id,
    delivery_channels = (
      SELECT COALESCE(array_agg(DISTINCT channel), ARRAY[]::public.invitation_delivery_channel[])
      FROM unnest(gi.delivery_channels || ARRAY['in_app']::public.invitation_delivery_channel[]) AS channel
    ),
    updated_at = NOW()
  WHERE gi.kind = 'member'
    AND gi.status = 'pending'
    AND gi.invited_user_id IS NULL
    AND gi.invited_email = v_normalized_email;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- Member invitation RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_member_invitation(
  p_group_id UUID,
  p_invited_email TEXT,
  p_delivery_channels public.invitation_delivery_channel[] DEFAULT ARRAY['email', 'in_app']::public.invitation_delivery_channel[],
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS public.group_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_normalized_email TEXT;
  v_target_user_id UUID;
  v_invite_code TEXT;
  v_invitation public.group_invitations;
  v_channels public.invitation_delivery_channel[];
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_group_admin_or_owner(p_group_id, v_user_id) THEN
    RAISE EXCEPTION 'Only group owners or admins can send invitations' USING ERRCODE = '42501';
  END IF;

  v_normalized_email := public.normalize_invitation_email(p_invited_email);

  IF NOT public.is_valid_invitation_email(v_normalized_email) THEN
    RAISE EXCEPTION 'Please enter a valid email address' USING ERRCODE = '22023';
  END IF;

  v_channels := COALESCE(p_delivery_channels, ARRAY['email', 'in_app']::public.invitation_delivery_channel[]);

  IF cardinality(v_channels) = 0 THEN
    RAISE EXCEPTION 'At least one delivery channel is required' USING ERRCODE = '22023';
  END IF;

  IF 'share_link' = ANY (v_channels) THEN
    RAISE EXCEPTION 'share_link is not valid for member invitations' USING ERRCODE = '22023';
  END IF;

  SELECT au.id
  INTO v_target_user_id
  FROM auth.users au
  WHERE lower(au.email) = v_normalized_email
  LIMIT 1;

  IF v_target_user_id = v_user_id THEN
    RAISE EXCEPTION 'You cannot invite yourself' USING ERRCODE = '22023';
  END IF;

  IF v_target_user_id IS NOT NULL AND public.is_group_member(p_group_id, v_target_user_id) THEN
    RAISE EXCEPTION 'This user is already a member of the group' USING ERRCODE = '23505';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.group_invitations gi
    WHERE gi.group_id = p_group_id
      AND gi.kind = 'member'
      AND gi.status = 'pending'
      AND gi.invited_email = v_normalized_email
  ) THEN
    RAISE EXCEPTION 'A pending invitation already exists for this email' USING ERRCODE = '23505';
  END IF;

  IF v_target_user_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.group_invitations gi
    WHERE gi.group_id = p_group_id
      AND gi.kind = 'member'
      AND gi.status = 'pending'
      AND gi.invited_user_id = v_target_user_id
  ) THEN
    RAISE EXCEPTION 'A pending invitation already exists for this user' USING ERRCODE = '23505';
  END IF;

  v_invite_code := public.generate_invite_code();
  WHILE EXISTS (SELECT 1 FROM public.group_invitations WHERE invite_code = v_invite_code) LOOP
    v_invite_code := public.generate_invite_code();
  END LOOP;

  INSERT INTO public.group_invitations (
    group_id,
    kind,
    status,
    invite_code,
    invited_email,
    invited_user_id,
    created_by,
    expires_at,
    active,
    delivery_channels,
    metadata
  )
  VALUES (
    p_group_id,
    'member',
    'pending',
    v_invite_code,
    v_normalized_email,
    v_target_user_id,
    v_user_id,
    p_expires_at,
    FALSE,
    v_channels,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING * INTO v_invitation;

  RETURN v_invitation;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_member_invitation(
  p_invitation_id UUID,
  p_accepted_via public.invitation_accepted_via DEFAULT 'application'
)
RETURNS public.group_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_invitation public.group_invitations;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT *
  INTO v_invitation
  FROM public.group_invitations gi
  WHERE gi.id = p_invitation_id
    AND gi.kind = 'member'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found' USING ERRCODE = '22023';
  END IF;

  PERFORM public.assert_member_invitation_pending(v_invitation);

  IF NOT public.is_invitation_recipient(
    v_invitation.invited_user_id,
    v_invitation.invited_email,
    v_user_id
  ) THEN
    RAISE EXCEPTION 'You are not authorized to accept this invitation' USING ERRCODE = '42501';
  END IF;

  IF public.is_group_member(v_invitation.group_id, v_user_id) THEN
    RAISE EXCEPTION 'You are already a member of this group' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_invitation.group_id, v_user_id, 'member');

  UPDATE public.group_invitations
  SET
    status = 'accepted',
    invited_user_id = COALESCE(invited_user_id, v_user_id),
    accepted_via = COALESCE(p_accepted_via, 'application'),
    responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_invitation_id
  RETURNING * INTO v_invitation;

  RETURN v_invitation;
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_member_invitation(p_invitation_id UUID)
RETURNS public.group_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_invitation public.group_invitations;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT *
  INTO v_invitation
  FROM public.group_invitations gi
  WHERE gi.id = p_invitation_id
    AND gi.kind = 'member'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found' USING ERRCODE = '22023';
  END IF;

  PERFORM public.assert_member_invitation_pending(v_invitation);

  IF NOT public.is_invitation_recipient(
    v_invitation.invited_user_id,
    v_invitation.invited_email,
    v_user_id
  ) THEN
    RAISE EXCEPTION 'You are not authorized to decline this invitation' USING ERRCODE = '42501';
  END IF;

  UPDATE public.group_invitations
  SET
    status = 'declined',
    invited_user_id = COALESCE(invited_user_id, v_user_id),
    responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_invitation_id
  RETURNING * INTO v_invitation;

  RETURN v_invitation;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_member_invitation(p_invitation_id UUID)
RETURNS public.group_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_invitation public.group_invitations;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT *
  INTO v_invitation
  FROM public.group_invitations gi
  WHERE gi.id = p_invitation_id
    AND gi.kind = 'member'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found' USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_group_admin_or_owner(v_invitation.group_id, v_user_id) THEN
    RAISE EXCEPTION 'Only group owners or admins can cancel invitations' USING ERRCODE = '42501';
  END IF;

  IF v_invitation.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending invitations can be cancelled' USING ERRCODE = '22023';
  END IF;

  UPDATE public.group_invitations
  SET
    status = 'cancelled',
    responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_invitation_id
  RETURNING * INTO v_invitation;

  RETURN v_invitation;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_member_invitation(p_invitation_id UUID)
RETURNS public.group_invitations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation public.group_invitations;
BEGIN
  SELECT *
  INTO v_invitation
  FROM public.group_invitations gi
  WHERE gi.id = p_invitation_id
    AND gi.kind = 'member'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found' USING ERRCODE = '22023';
  END IF;

  IF v_invitation.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending invitations can be expired' USING ERRCODE = '22023';
  END IF;

  IF v_invitation.expires_at IS NULL OR v_invitation.expires_at >= NOW() THEN
    RAISE EXCEPTION 'Invitation has not reached its expiry time' USING ERRCODE = '22023';
  END IF;

  UPDATE public.group_invitations
  SET
    status = 'expired',
    responded_at = NOW(),
    updated_at = NOW()
  WHERE id = p_invitation_id
  RETURNING * INTO v_invitation;

  RETURN v_invitation;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pending_member_invitations()
RETURNS SETOF public.group_invitations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gi.*
  FROM public.group_invitations gi
  WHERE gi.kind = 'member'
    AND gi.status = 'pending'
    AND public.is_invitation_recipient(gi.invited_user_id, gi.invited_email, auth.uid())
  ORDER BY gi.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_group_member_invitations(p_group_id UUID)
RETURNS SETOF public.group_invitations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gi.*
  FROM public.group_invitations gi
  WHERE gi.group_id = p_group_id
    AND gi.kind = 'member'
    AND (
      public.is_group_admin_or_owner(p_group_id, auth.uid())
      OR public.is_invitation_recipient(gi.invited_user_id, gi.invited_email, auth.uid())
    )
  ORDER BY gi.created_at DESC;
$$;

-- Keep share-link RPCs compatible with the extended schema.
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

  INSERT INTO public.group_invitations (
    group_id,
    kind,
    invite_code,
    created_by,
    active,
    delivery_channels
  )
  VALUES (
    v_group.id,
    'share_link',
    v_invite_code,
    v_user_id,
    TRUE,
    ARRAY['share_link']::public.invitation_delivery_channel[]
  );

  RETURN v_group;
END;
$$;

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
    AND kind = 'share_link'
    AND active = TRUE;

  INSERT INTO public.group_invitations (
    group_id,
    kind,
    invite_code,
    created_by,
    active,
    delivery_channels
  )
  VALUES (
    p_group_id,
    'share_link',
    v_invite_code,
    v_user_id,
    TRUE,
    ARRAY['share_link']::public.invitation_delivery_channel[]
  );

  UPDATE public.groups
  SET invite_code = v_invite_code
  WHERE id = p_group_id;

  RETURN v_invite_code;
END;
$$;

-- Scope share-link joins to share_link rows only (member invite codes stay inactive).
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
    AND gi.kind = 'share_link'
    AND gi.active = TRUE
  LIMIT 1;

  IF v_invitation_id IS NULL THEN
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

GRANT EXECUTE ON FUNCTION public.is_group_admin_or_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_pending_invitations_to_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_member_invitation(UUID, TEXT, public.invitation_delivery_channel[], TIMESTAMPTZ, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_member_invitation(UUID, public.invitation_accepted_via) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_member_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_member_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_member_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_member_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_member_invitations(UUID) TO authenticated;
