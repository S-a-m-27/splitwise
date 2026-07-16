-- =============================================================================
-- Migration: invitation_notifications_and_search
-- Purpose: In-app notifications, invite search, realtime for notification sync.
-- =============================================================================

CREATE TYPE public.notification_type AS ENUM (
  'invitation_received',
  'invitation_linked'
);

CREATE TABLE public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type            public.notification_type NOT NULL,
  invitation_id   UUID REFERENCES public.group_invitations (id) ON DELETE CASCADE,
  group_id        UUID REFERENCES public.groups (id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_title_not_empty CHECK (char_length(trim(title)) > 0)
);

COMMENT ON TABLE public.notifications IS
  'In-app notifications; invitation_received for registered invitees, invitation_linked after signup.';

CREATE INDEX notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX notifications_user_unread_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE UNIQUE INDEX notifications_unique_active_invitation
  ON public.notifications (user_id, invitation_id)
  WHERE invitation_id IS NOT NULL AND read_at IS NULL;

-- ---------------------------------------------------------------------------
-- Notification trigger on member invitations
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_invitation_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_name TEXT;
  v_inviter_name TEXT;
BEGIN
  IF NEW.kind <> 'member' OR NEW.status <> 'pending' OR NEW.invited_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT g.name INTO v_group_name FROM public.groups g WHERE g.id = NEW.group_id;
  SELECT p.full_name INTO v_inviter_name FROM public.profiles p WHERE p.id = NEW.created_by;

  INSERT INTO public.notifications (
    user_id,
    type,
    invitation_id,
    group_id,
    title,
    body
  )
  VALUES (
    NEW.invited_user_id,
    CASE
      WHEN TG_OP = 'UPDATE' AND OLD.invited_user_id IS NULL THEN 'invitation_linked'::public.notification_type
      ELSE 'invitation_received'::public.notification_type
    END,
    NEW.id,
    NEW.group_id,
    COALESCE(v_inviter_name, 'Someone') || ' invited you',
    'Join ' || COALESCE(v_group_name, 'a group') || ' on Bitwisse.'
  )
  ON CONFLICT (user_id, invitation_id)
  WHERE invitation_id IS NOT NULL AND read_at IS NULL
  DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS group_invitations_create_notification ON public.group_invitations;

CREATE TRIGGER group_invitations_create_notification
  AFTER INSERT OR UPDATE OF invited_user_id ON public.group_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_invitation_notification();

-- ---------------------------------------------------------------------------
-- Search registered users for invite flow
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_invite_candidates(
  p_group_id UUID,
  p_query TEXT
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  is_registered BOOLEAN,
  state TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_normalized_query TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_group_admin_or_owner(p_group_id, v_user_id) THEN
    RAISE EXCEPTION 'Only group owners or admins can search invite candidates' USING ERRCODE = '42501';
  END IF;

  v_normalized_query := lower(trim(p_query));

  IF char_length(v_normalized_query) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name AS display_name,
    lower(au.email::text) AS email,
    p.avatar_url,
    TRUE AS is_registered,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = p_group_id AND gm.user_id = p.id
      ) THEN 'already_member'
      WHEN EXISTS (
        SELECT 1 FROM public.group_invitations gi
        WHERE gi.group_id = p_group_id
          AND gi.kind = 'member'
          AND gi.status = 'pending'
          AND (gi.invited_user_id = p.id OR gi.invited_email = lower(au.email::text))
      ) THEN 'invitation_pending'
      ELSE 'available'
    END AS state
  FROM public.profiles p
  INNER JOIN auth.users au ON au.id = p.id
  WHERE p.id <> v_user_id
    AND (
      lower(p.full_name) LIKE '%' || v_normalized_query || '%'
      OR lower(au.email::text) LIKE '%' || v_normalized_query || '%'
    )
  ORDER BY p.full_name
  LIMIT 20;
END;
$$;

-- ---------------------------------------------------------------------------
-- Notification helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.notifications n
  WHERE n.user_id = auth.uid()
    AND n.read_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_invitation_notifications()
RETURNS SETOF public.notifications
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT n.*
  FROM public.notifications n
  WHERE n.user_id = auth.uid()
    AND n.type IN ('invitation_received', 'invitation_linked')
  ORDER BY n.created_at DESC
  LIMIT 50;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_invite_candidates(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invitation_notifications() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_email_registered(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users au
    WHERE lower(au.email::text) = public.normalize_invitation_email(p_email)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_email_registered(TEXT) TO authenticated;
