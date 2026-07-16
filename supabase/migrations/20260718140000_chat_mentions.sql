-- =============================================================================
-- Migration: chat_mentions
-- Purpose: Validate and persist group mentions in the transactional send RPC.
-- =============================================================================

DROP FUNCTION IF EXISTS public.send_chat_message(
  UUID,
  TEXT,
  UUID,
  public.message_type,
  UUID
);

CREATE FUNCTION public.send_chat_message(
  p_conversation_id UUID,
  p_content TEXT,
  p_client_message_id UUID,
  p_message_type public.message_type DEFAULT 'text',
  p_reply_to_message_id UUID DEFAULT NULL,
  p_mentioned_user_ids UUID[] DEFAULT '{}'::UUID[]
)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID := auth.uid();
  v_message public.messages;
  v_sender_name TEXT;
  v_preview TEXT;
  v_conversation_type public.conversation_type;
  v_group_id UUID;
  v_mentioned_user_ids UUID[] := '{}'::UUID[];
BEGIN
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT c.type, c.group_id
  INTO v_conversation_type, v_group_id
  FROM public.conversations c
  WHERE c.id = p_conversation_id
    AND c.deleted_at IS NULL;

  IF v_conversation_type IS NULL
    OR NOT public.is_conversation_member(p_conversation_id, v_sender_id)
  THEN
    RAISE EXCEPTION 'Conversation access denied' USING ERRCODE = '42501';
  END IF;

  IF v_conversation_type = 'group'
    AND (v_group_id IS NULL OR NOT public.is_group_member(v_group_id, v_sender_id))
  THEN
    RAISE EXCEPTION 'Group membership is required' USING ERRCODE = '42501';
  END IF;

  IF v_conversation_type = 'announcement' THEN
    RAISE EXCEPTION 'Conversation is read-only' USING ERRCODE = '42501';
  END IF;

  IF p_message_type <> 'text' THEN
    RAISE EXCEPTION 'Only text messages are currently supported' USING ERRCODE = '22023';
  END IF;

  IF p_content IS NULL OR char_length(trim(p_content)) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty' USING ERRCODE = '22023';
  END IF;

  IF char_length(trim(p_content)) > 4000 THEN
    RAISE EXCEPTION 'Message exceeds 4000 characters' USING ERRCODE = '22001';
  END IF;

  IF p_reply_to_message_id IS NOT NULL THEN
    RAISE EXCEPTION 'Replies are not supported in this phase' USING ERRCODE = '0A000';
  END IF;

  SELECT COALESCE(array_agg(DISTINCT mentioned_user_id), '{}'::UUID[])
  INTO v_mentioned_user_ids
  FROM unnest(COALESCE(p_mentioned_user_ids, '{}'::UUID[]))
    AS mentions(mentioned_user_id)
  WHERE mentioned_user_id <> v_sender_id;

  IF cardinality(v_mentioned_user_ids) > 50 THEN
    RAISE EXCEPTION 'Too many mentioned users' USING ERRCODE = '22023';
  END IF;

  IF cardinality(v_mentioned_user_ids) > 0 AND v_conversation_type <> 'group' THEN
    RAISE EXCEPTION 'Mentions are only supported in group conversations'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(v_mentioned_user_ids) AS mentions(mentioned_user_id)
    WHERE NOT public.is_conversation_member(p_conversation_id, mentioned_user_id)
  ) THEN
    RAISE EXCEPTION 'Mentioned user is not an active conversation member'
      USING ERRCODE = '42501';
  END IF;

  IF p_client_message_id IS NOT NULL THEN
    SELECT m.*
    INTO v_message
    FROM public.messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.sender_id = v_sender_id
      AND m.client_message_id = p_client_message_id
      AND m.deleted_at IS NULL
    LIMIT 1;

    IF v_message.id IS NOT NULL THEN
      RETURN v_message;
    END IF;
  END IF;

  INSERT INTO public.messages (
    conversation_id,
    sender_id,
    message_type,
    content,
    client_message_id,
    reply_to_message_id,
    metadata
  )
  VALUES (
    p_conversation_id,
    v_sender_id,
    p_message_type,
    trim(p_content),
    p_client_message_id,
    p_reply_to_message_id,
    jsonb_build_object('mentioned_user_ids', to_jsonb(v_mentioned_user_ids))
  )
  ON CONFLICT (conversation_id, sender_id, client_message_id)
    WHERE client_message_id IS NOT NULL AND deleted_at IS NULL
  DO NOTHING
  RETURNING * INTO v_message;

  IF v_message.id IS NULL THEN
    SELECT m.*
    INTO v_message
    FROM public.messages m
    WHERE m.conversation_id = p_conversation_id
      AND m.sender_id = v_sender_id
      AND m.client_message_id = p_client_message_id
      AND m.deleted_at IS NULL
    LIMIT 1;
    RETURN v_message;
  END IF;

  v_preview := left(trim(p_content), 280);
  SELECT COALESCE(NULLIF(trim(p.full_name), ''), 'Someone')
  INTO v_sender_name
  FROM public.profiles p
  WHERE p.id = v_sender_id;

  UPDATE public.conversations
  SET
    last_message_at = v_message.created_at,
    last_message_preview = v_preview
  WHERE id = p_conversation_id;

  UPDATE public.conversation_members
  SET unread_count = unread_count + 1
  WHERE conversation_id = p_conversation_id
    AND user_id <> v_sender_id
    AND left_at IS NULL;

  INSERT INTO public.notifications (
    user_id,
    type,
    conversation_id,
    message_id,
    group_id,
    title,
    body
  )
  SELECT
    cm.user_id,
    'chat_message'::public.notification_type,
    p_conversation_id,
    v_message.id,
    c.group_id,
    CASE
      WHEN cm.user_id = ANY(v_mentioned_user_ids)
        THEN COALESCE(v_sender_name, 'Someone') || ' mentioned you'
      ELSE 'New message from ' || COALESCE(v_sender_name, 'Someone')
    END,
    v_preview
  FROM public.conversation_members cm
  INNER JOIN public.conversations c ON c.id = cm.conversation_id
  WHERE cm.conversation_id = p_conversation_id
    AND cm.user_id <> v_sender_id
    AND cm.left_at IS NULL
    AND cm.muted_at IS NULL
  ON CONFLICT (user_id, conversation_id)
    WHERE type = 'chat_message'
      AND conversation_id IS NOT NULL
      AND read_at IS NULL
  DO UPDATE SET
    message_id = EXCLUDED.message_id,
    group_id = EXCLUDED.group_id,
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    created_at = NOW();

  PERFORM public.log_chat_audit_event(
    p_conversation_id,
    v_sender_id,
    'message_created',
    jsonb_build_object(
      'message_id', v_message.id,
      'client_message_id', p_client_message_id,
      'message_type', p_message_type,
      'mentioned_user_ids', to_jsonb(v_mentioned_user_ids)
    )
  );

  RETURN v_message;
END;
$$;

REVOKE ALL ON FUNCTION public.send_chat_message(
  UUID,
  TEXT,
  UUID,
  public.message_type,
  UUID,
  UUID[]
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.send_chat_message(
  UUID,
  TEXT,
  UUID,
  public.message_type,
  UUID,
  UUID[]
) TO authenticated;

COMMENT ON FUNCTION public.send_chat_message(
  UUID,
  TEXT,
  UUID,
  public.message_type,
  UUID,
  UUID[]
) IS
  'Atomically sends a message and validates group mentions before persisting metadata and notifications.';
