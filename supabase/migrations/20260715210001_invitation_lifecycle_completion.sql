-- =============================================================================
-- Migration: invitation_lifecycle_completion
-- Purpose: Activity log, lifecycle notifications, recipient history RPC.
-- Depends on: 20260715210000_invitation_lifecycle_enum_values.sql
-- =============================================================================

CREATE TYPE public.group_activity_type AS ENUM (
  'invitation_sent',
  'invitation_accepted',
  'invitation_declined',
  'invitation_cancelled',
  'invitation_expired',
  'member_joined'
);

CREATE TABLE public.group_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  actor_user_id   UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  type            public.group_activity_type NOT NULL,
  invitation_id   UUID REFERENCES public.group_invitations (id) ON DELETE SET NULL,
  description     TEXT NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT group_activities_description_not_empty CHECK (char_length(trim(description)) > 0)
);

COMMENT ON TABLE public.group_activities IS
  'Immutable group activity feed entries for invitations and membership events.';

CREATE INDEX group_activities_group_id_idx
  ON public.group_activities (group_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Lifecycle side effects (notifications + activity) — runs in same transaction
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

    IF OLD.status = 'pending' AND v_recipient_id IS NOT NULL THEN
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

DROP TRIGGER IF EXISTS group_invitations_lifecycle_side_effects ON public.group_invitations;

CREATE TRIGGER group_invitations_lifecycle_side_effects
  AFTER INSERT OR UPDATE OF status ON public.group_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invitation_lifecycle_side_effects();

-- ---------------------------------------------------------------------------
-- Read APIs
-- ---------------------------------------------------------------------------

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
  ORDER BY gi.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_group_activities(
  p_group_id UUID,
  p_limit INTEGER DEFAULT 50
)
RETURNS SETOF public.group_activities
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ga.*
  FROM public.group_activities ga
  WHERE ga.group_id = p_group_id
    AND public.is_group_member(p_group_id, auth.uid())
  ORDER BY ga.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 50), 100));
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
    AND n.type IN (
      'invitation_received',
      'invitation_linked',
      'invitation_accepted',
      'invitation_declined'
    )
  ORDER BY n.created_at DESC
  LIMIT 50;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.group_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_activities_select_member"
  ON public.group_activities
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

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
        AND tablename = 'group_activities'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.group_activities;
    END IF;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_received_member_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_activities(UUID, INTEGER) TO authenticated;
