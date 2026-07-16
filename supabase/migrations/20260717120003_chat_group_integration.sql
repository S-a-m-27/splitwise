-- =============================================================================
-- Migration: chat_group_integration
-- Purpose: One conversation per group; sync membership from group_members.
-- Depends on: 20260717120002_chat_rls
-- Does NOT modify invitation frontend/edge — uses group_members triggers only.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extend create_group to provision group conversation
-- ---------------------------------------------------------------------------

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

  PERFORM public.create_group_conversation(v_group.id, v_user_id);

  RETURN v_group;
END;
$$;

-- ---------------------------------------------------------------------------
-- Sync conversation membership when group_members changes
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_group_conversation_member_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_role public.conversation_member_role;
BEGIN
  SELECT c.id
  INTO v_conversation_id
  FROM public.conversations c
  WHERE c.type = 'group'
    AND c.group_id = NEW.group_id
    AND c.deleted_at IS NULL
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    v_conversation_id := public.create_group_conversation(NEW.group_id, NEW.user_id);
  END IF;

  v_role := CASE NEW.role
    WHEN 'owner' THEN 'owner'::public.conversation_member_role
    WHEN 'admin' THEN 'admin'::public.conversation_member_role
    ELSE 'member'::public.conversation_member_role
  END;

  INSERT INTO public.conversation_members (
    conversation_id,
    user_id,
    role,
    left_at
  )
  VALUES (
    v_conversation_id,
    NEW.user_id,
    v_role,
    NULL
  )
  ON CONFLICT (conversation_id, user_id) DO UPDATE
  SET
    role = EXCLUDED.role,
    left_at = NULL,
    joined_at = CASE
      WHEN conversation_members.left_at IS NOT NULL THEN NOW()
      ELSE conversation_members.joined_at
    END;

  PERFORM public.log_chat_audit_event(
    v_conversation_id,
    NEW.user_id,
    'member_joined',
    jsonb_build_object('group_id', NEW.group_id, 'role', NEW.role)
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_group_conversation_member_removed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  SELECT c.id
  INTO v_conversation_id
  FROM public.conversations c
  WHERE c.type = 'group'
    AND c.group_id = OLD.group_id
    AND c.deleted_at IS NULL
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    RETURN OLD;
  END IF;

  UPDATE public.conversation_members
  SET left_at = NOW()
  WHERE conversation_id = v_conversation_id
    AND user_id = OLD.user_id
    AND left_at IS NULL;

  PERFORM public.log_chat_audit_event(
    v_conversation_id,
    OLD.user_id,
    'member_left',
    jsonb_build_object('group_id', OLD.group_id)
  );

  RETURN OLD;
END;
$$;

CREATE TRIGGER group_members_sync_conversation_added
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_group_conversation_member_added();

CREATE TRIGGER group_members_sync_conversation_removed
  AFTER DELETE ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_group_conversation_member_removed();

-- ---------------------------------------------------------------------------
-- Archive group conversation when group is deleted (soft-delete conversation)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.archive_group_conversation_on_group_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  SELECT c.id
  INTO v_conversation_id
  FROM public.conversations c
  WHERE c.type = 'group'
    AND c.group_id = OLD.id
    AND c.deleted_at IS NULL
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    RETURN OLD;
  END IF;

  UPDATE public.conversations
  SET deleted_at = NOW()
  WHERE id = v_conversation_id;

  PERFORM public.log_chat_audit_event(
    v_conversation_id,
    auth.uid(),
    'conversation_archived',
    jsonb_build_object('group_id', OLD.id, 'reason', 'group_deleted')
  );

  RETURN OLD;
END;
$$;

CREATE TRIGGER groups_archive_conversation_on_delete
  BEFORE DELETE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.archive_group_conversation_on_group_delete();

-- ---------------------------------------------------------------------------
-- Backfill: one conversation per existing group
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_group RECORD;
BEGIN
  FOR v_group IN
    SELECT g.id, g.created_by
    FROM public.groups g
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.type = 'group'
        AND c.group_id = g.id
        AND c.deleted_at IS NULL
    )
  LOOP
    PERFORM public.create_group_conversation(v_group.id, v_group.created_by);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Realtime foundation (no client subscription in Phase 1)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversation_members'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
    END IF;
  END IF;
END;
$$;
