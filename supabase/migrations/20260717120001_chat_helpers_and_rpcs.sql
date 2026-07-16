-- =============================================================================
-- Migration: chat_helpers_and_rpcs
-- Purpose: Permission helpers, DM dedup, read RPCs. No message send in Phase 1.
-- Depends on: 20260717120000_chat_domain_schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- DM pair key (canonical ordering prevents A↔B / B↔A duplicates)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.build_dm_pair_key(
  p_user_a UUID,
  p_user_b UUID
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_user_a::text < p_user_b::text THEN p_user_a::text || ':' || p_user_b::text
    ELSE p_user_b::text || ':' || p_user_a::text
  END;
$$;

-- ---------------------------------------------------------------------------
-- Membership & permission helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_conversation_member(
  p_conversation_id UUID,
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
    FROM public.conversation_members cm
    INNER JOIN public.conversations c ON c.id = cm.conversation_id
    WHERE cm.conversation_id = p_conversation_id
      AND cm.user_id = p_user_id
      AND cm.left_at IS NULL
      AND c.deleted_at IS NULL
      AND (
        c.type <> 'group'
        OR (
          c.group_id IS NOT NULL
          AND public.is_group_member(c.group_id, p_user_id)
        )
      )
  );
$$;

COMMENT ON FUNCTION public.is_conversation_member IS
  'True when user is an active conversation member AND still a group member for group chats.';

CREATE OR REPLACE FUNCTION public.is_conversation_admin(
  p_conversation_id UUID,
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
    FROM public.conversation_members cm
    WHERE cm.conversation_id = p_conversation_id
      AND cm.user_id = p_user_id
      AND cm.left_at IS NULL
      AND cm.role IN ('owner', 'admin', 'moderator')
  );
$$;

-- ---------------------------------------------------------------------------
-- Audit helper
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_chat_audit_event(
  p_conversation_id UUID,
  p_actor_user_id UUID,
  p_event_type public.chat_audit_event_type,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.chat_audit_events (
    conversation_id,
    actor_user_id,
    event_type,
    metadata
  )
  VALUES (
    p_conversation_id,
    p_actor_user_id,
    p_event_type,
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Internal: create group conversation (idempotent)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_group_conversation(
  p_group_id UUID,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
  v_member RECORD;
BEGIN
  SELECT c.id
  INTO v_conversation_id
  FROM public.conversations c
  WHERE c.type = 'group'
    AND c.group_id = p_group_id
    AND c.deleted_at IS NULL
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO public.conversations (
    type,
    group_id,
    created_by
  )
  VALUES (
    'group',
    p_group_id,
    p_created_by
  )
  RETURNING id INTO v_conversation_id;

  PERFORM public.log_chat_audit_event(
    v_conversation_id,
    p_created_by,
    'conversation_created',
    jsonb_build_object('group_id', p_group_id, 'type', 'group')
  );

  FOR v_member IN
    SELECT gm.user_id, gm.role
    FROM public.group_members gm
    WHERE gm.group_id = p_group_id
  LOOP
    INSERT INTO public.conversation_members (
      conversation_id,
      user_id,
      role
    )
    VALUES (
      v_conversation_id,
      v_member.user_id,
      CASE v_member.role
        WHEN 'owner' THEN 'owner'::public.conversation_member_role
        WHEN 'admin' THEN 'admin'::public.conversation_member_role
        ELSE 'member'::public.conversation_member_role
      END
    )
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END LOOP;

  RETURN v_conversation_id;
END;
$$;

COMMENT ON FUNCTION public.create_group_conversation IS
  'Creates exactly one group conversation and seeds members from group_members. Idempotent.';

-- ---------------------------------------------------------------------------
-- Get or create direct conversation (deduplicated by dm_pair_key)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_or_create_direct_conversation(
  p_other_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_pair_key TEXT;
  v_conversation_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_other_user_id IS NULL THEN
    RAISE EXCEPTION 'Other user is required' USING ERRCODE = '22023';
  END IF;

  IF v_user_id = p_other_user_id THEN
    RAISE EXCEPTION 'Cannot create a direct conversation with yourself' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_other_user_id) THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = 'P0002';
  END IF;

  v_pair_key := public.build_dm_pair_key(v_user_id, p_other_user_id);

  SELECT c.id
  INTO v_conversation_id
  FROM public.conversations c
  WHERE c.type = 'direct'
    AND c.dm_pair_key = v_pair_key
    AND c.deleted_at IS NULL
  LIMIT 1;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  INSERT INTO public.conversations (
    type,
    created_by,
    dm_pair_key
  )
  VALUES (
    'direct',
    v_user_id,
    v_pair_key
  )
  RETURNING id INTO v_conversation_id;

  INSERT INTO public.conversation_members (conversation_id, user_id, role)
  VALUES
    (v_conversation_id, v_user_id, 'member'),
    (v_conversation_id, p_other_user_id, 'member');

  PERFORM public.log_chat_audit_event(
    v_conversation_id,
    v_user_id,
    'conversation_created',
    jsonb_build_object('type', 'direct', 'other_user_id', p_other_user_id)
  );

  RETURN v_conversation_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Read RPCs (Phase 1 — no message writes)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_group_conversation(
  p_group_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_conversation_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_group_member(p_group_id, v_user_id) THEN
    RAISE EXCEPTION 'You do not have access to this group conversation' USING ERRCODE = '42501';
  END IF;

  SELECT c.id
  INTO v_conversation_id
  FROM public.conversations c
  WHERE c.type = 'group'
    AND c.group_id = p_group_id
    AND c.deleted_at IS NULL
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    RAISE EXCEPTION 'Group conversation not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_conversation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_user_conversations(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.conversations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.*
  FROM public.conversations c
  INNER JOIN public.conversation_members cm ON cm.conversation_id = c.id
  WHERE cm.user_id = auth.uid()
    AND cm.left_at IS NULL
    AND c.deleted_at IS NULL
    AND public.is_conversation_member(c.id, auth.uid())
  ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC
  LIMIT GREATEST(LEAST(COALESCE(p_limit, 50), 100), 1)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT EXECUTE ON FUNCTION public.build_dm_pair_key(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_admin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_direct_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_user_conversations(INTEGER, INTEGER) TO authenticated;
