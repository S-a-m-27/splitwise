-- =============================================================================
-- Migration: invitation_security_hardening
-- Purpose: Close security gaps and lifecycle edge cases found in production audit.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Global invite code uniqueness (member + share-link namespaces)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.generate_unique_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
BEGIN
  v_code := public.generate_invite_code();
  WHILE EXISTS (
    SELECT 1 FROM public.group_invitations gi WHERE gi.invite_code = v_code
    UNION ALL
    SELECT 1 FROM public.groups g WHERE g.invite_code = v_code
  ) LOOP
    v_code := public.generate_invite_code();
  END LOOP;
  RETURN v_code;
END;
$$;

-- Patch create_member_invitation to use global uniqueness
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

  IF p_expires_at IS NOT NULL AND p_expires_at <= NOW() THEN
    RAISE EXCEPTION 'Expiry must be in the future' USING ERRCODE = '22023';
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
      AND (gi.expires_at IS NULL OR gi.expires_at >= NOW())
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
      AND (gi.expires_at IS NULL OR gi.expires_at >= NOW())
  ) THEN
    RAISE EXCEPTION 'A pending invitation already exists for this user' USING ERRCODE = '23505';
  END IF;

  v_invite_code := public.generate_unique_invite_code();

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

-- ---------------------------------------------------------------------------
-- Secure link_pending_invitations_to_user (trigger-only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.link_pending_invitations_to_user(
  p_user_id UUID,
  p_email TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_normalized_email TEXT;
  v_updated_count INTEGER;
BEGIN
  IF p_user_id IS NULL OR p_email IS NULL THEN
    RETURN 0;
  END IF;

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
    AND gi.invited_email = v_normalized_email
    AND (gi.expires_at IS NULL OR gi.expires_at >= NOW());

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.link_pending_invitations_to_user(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_pending_invitations_to_user(UUID, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.link_pending_invitations_to_user(UUID, TEXT) FROM anon;

-- ---------------------------------------------------------------------------
-- Auto-expire stale pending invitations on action
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assert_member_invitation_pending(
  p_invitation public.group_invitations
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_invitation.kind <> 'member' THEN
    RAISE EXCEPTION 'Invitation is not a member invitation' USING ERRCODE = '22023';
  END IF;

  IF p_invitation.status <> 'pending' THEN
    RAISE EXCEPTION 'Invitation is not pending' USING ERRCODE = '22023';
  END IF;

  IF p_invitation.expires_at IS NOT NULL AND p_invitation.expires_at < NOW() THEN
    UPDATE public.group_invitations
    SET
      status = 'expired',
      responded_at = NOW(),
      updated_at = NOW()
    WHERE id = p_invitation.id
      AND status = 'pending';

    RAISE EXCEPTION 'Invitation has expired' USING ERRCODE = '22023';
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Restrict expire_member_invitation to group admins/owners
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_member_invitation(p_invitation_id UUID)
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
    RAISE EXCEPTION 'Only group owners or admins can expire invitations' USING ERRCODE = '42501';
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

-- ---------------------------------------------------------------------------
-- Cancel pending invitations when owner adds member directly
-- ---------------------------------------------------------------------------

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

  UPDATE public.group_invitations
  SET
    status = 'cancelled',
    responded_at = NOW(),
    updated_at = NOW()
  WHERE group_id = p_group_id
    AND kind = 'member'
    AND status = 'pending'
    AND (
      invited_email = v_normalized_email
      OR invited_user_id = v_target_user_id
    );

  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (p_group_id, v_target_user_id, 'member');

  RETURN v_target_user_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Filter time-expired pending rows from recipient reads
-- ---------------------------------------------------------------------------

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
    AND (gi.expires_at IS NULL OR gi.expires_at >= NOW())
    AND public.is_invitation_recipient(gi.invited_user_id, gi.invited_email, auth.uid())
  ORDER BY gi.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_received_member_invitations()
RETURNS SETOF public.group_invitations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gi.*
  FROM public.group_invitations gi
  WHERE gi.kind = 'member'
    AND public.is_invitation_recipient(gi.invited_user_id, gi.invited_email, auth.uid())
    AND NOT (gi.status = 'pending' AND gi.expires_at IS NOT NULL AND gi.expires_at < NOW())
  ORDER BY gi.created_at DESC;
$$;

-- ---------------------------------------------------------------------------
-- Lifecycle trigger: clear recipient notifications on cancel/expire too
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_invitation_lifecycle_side_effects()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_name TEXT;
  v_actor_name TEXT;
  v_recipient_name TEXT;
  v_recipient_id UUID;
BEGIN
  IF NEW.kind <> 'member' THEN
    RETURN NEW;
  END IF;

  SELECT g.name INTO v_group_name FROM public.groups g WHERE g.id = NEW.group_id;

  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    SELECT p.full_name INTO v_actor_name FROM public.profiles p WHERE p.id = NEW.created_by;

    INSERT INTO public.group_activities (
      group_id,
      actor_user_id,
      type,
      invitation_id,
      description
    )
    VALUES (
      NEW.group_id,
      NEW.created_by,
      'invitation_sent',
      NEW.id,
      COALESCE(v_actor_name, 'Someone') || ' invited ' || COALESCE(NEW.invited_email, 'someone')
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    v_recipient_id := COALESCE(NEW.invited_user_id, OLD.invited_user_id);

    IF OLD.status = 'pending'
      AND NEW.status IN ('accepted', 'declined', 'cancelled', 'expired')
      AND v_recipient_id IS NOT NULL
    THEN
      UPDATE public.notifications n
      SET read_at = NOW()
      WHERE n.invitation_id = NEW.id
        AND n.user_id = v_recipient_id
        AND n.read_at IS NULL;
    END IF;

    IF NEW.status = 'accepted' THEN
      SELECT p.full_name INTO v_recipient_name
      FROM public.profiles p
      WHERE p.id = v_recipient_id;

      INSERT INTO public.group_activities (
        group_id,
        actor_user_id,
        type,
        invitation_id,
        description
      )
      VALUES (
        NEW.group_id,
        v_recipient_id,
        'member_joined',
        NEW.id,
        COALESCE(v_recipient_name, 'A member') || ' joined the group'
      );

      INSERT INTO public.group_activities (
        group_id,
        actor_user_id,
        type,
        invitation_id,
        description
      )
      VALUES (
        NEW.group_id,
        v_recipient_id,
        'invitation_accepted',
        NEW.id,
        COALESCE(v_recipient_name, 'Someone') || ' accepted the invitation'
      );

      IF NEW.created_by IS NOT NULL AND NEW.created_by IS DISTINCT FROM v_recipient_id THEN
        INSERT INTO public.notifications (
          user_id,
          type,
          invitation_id,
          group_id,
          title,
          body
        )
        VALUES (
          NEW.created_by,
          'invitation_accepted',
          NEW.id,
          NEW.group_id,
          COALESCE(v_recipient_name, 'Someone') || ' joined ' || COALESCE(v_group_name, 'your group'),
          'They accepted your invitation.'
        );
      END IF;
    ELSIF NEW.status = 'declined' THEN
      SELECT p.full_name INTO v_recipient_name
      FROM public.profiles p
      WHERE p.id = v_recipient_id;

      INSERT INTO public.group_activities (
        group_id,
        actor_user_id,
        type,
        invitation_id,
        description
      )
      VALUES (
        NEW.group_id,
        v_recipient_id,
        'invitation_declined',
        NEW.id,
        COALESCE(v_recipient_name, 'Someone') || ' declined the invitation'
      );

      IF NEW.created_by IS NOT NULL AND NEW.created_by IS DISTINCT FROM v_recipient_id THEN
        INSERT INTO public.notifications (
          user_id,
          type,
          invitation_id,
          group_id,
          title,
          body
        )
        VALUES (
          NEW.created_by,
          'invitation_declined',
          NEW.id,
          NEW.group_id,
          COALESCE(v_recipient_name, 'Someone') || ' declined ' || COALESCE(v_group_name, 'your group'),
          'The invitation is no longer active.'
        );
      END IF;
    ELSIF NEW.status = 'cancelled' THEN
      SELECT p.full_name INTO v_actor_name FROM public.profiles p WHERE p.id = NEW.created_by;

      INSERT INTO public.group_activities (
        group_id,
        actor_user_id,
        type,
        invitation_id,
        description
      )
      VALUES (
        NEW.group_id,
        NEW.created_by,
        'invitation_cancelled',
        NEW.id,
        COALESCE(v_actor_name, 'An admin') || ' cancelled an invitation'
      );
    ELSIF NEW.status = 'expired' THEN
      INSERT INTO public.group_activities (
        group_id,
        actor_user_id,
        type,
        invitation_id,
        description
      )
      VALUES (
        NEW.group_id,
        NULL,
        'invitation_expired',
        NEW.id,
        'An invitation to ' || COALESCE(NEW.invited_email, 'someone') || ' expired'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Performance indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS notifications_invitation_id_unread_idx
  ON public.notifications (invitation_id)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS group_invitations_expired_pending_idx
  ON public.group_invitations (expires_at)
  WHERE kind = 'member' AND status = 'pending' AND expires_at IS NOT NULL;
