-- =============================================================================
-- Chat lifecycle commands. All message/read writes remain RPC-only.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.send_chat_message(
  p_conversation_id UUID,
  p_content TEXT,
  p_client_message_id UUID,
  p_message_type public.message_type DEFAULT 'text',
  p_reply_to_message_id UUID DEFAULT NULL
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
    reply_to_message_id
  )
  VALUES (
    p_conversation_id,
    v_sender_id,
    p_message_type,
    trim(p_content),
    p_client_message_id,
    p_reply_to_message_id
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
    'New message from ' || COALESCE(v_sender_name, 'Someone'),
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
      'message_type', p_message_type
    )
  );

  RETURN v_message;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(
  p_conversation_id UUID,
  p_message_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_target_created_at TIMESTAMPTZ;
  v_current_message_id UUID;
  v_current_created_at TIMESTAMPTZ;
  v_remaining_unread INTEGER;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_conversation_member(p_conversation_id, v_user_id) THEN
    RAISE EXCEPTION 'Conversation access denied' USING ERRCODE = '42501';
  END IF;

  SELECT m.created_at
  INTO v_target_created_at
  FROM public.messages m
  WHERE m.id = p_message_id
    AND m.conversation_id = p_conversation_id
    AND m.deleted_at IS NULL;

  IF v_target_created_at IS NULL THEN
    RAISE EXCEPTION 'Read cursor message not found' USING ERRCODE = '22023';
  END IF;

  SELECT cm.last_read_message_id
  INTO v_current_message_id
  FROM public.conversation_members cm
  WHERE cm.conversation_id = p_conversation_id
    AND cm.user_id = v_user_id
    AND cm.left_at IS NULL
  FOR UPDATE;

  IF v_current_message_id IS NOT NULL THEN
    SELECT m.created_at
    INTO v_current_created_at
    FROM public.messages m
    WHERE m.id = v_current_message_id;

    IF v_current_created_at > v_target_created_at
      OR (
        v_current_created_at = v_target_created_at
        AND v_current_message_id::TEXT >= p_message_id::TEXT
      )
    THEN
      RETURN;
    END IF;
  END IF;

  SELECT count(*)::INTEGER
  INTO v_remaining_unread
  FROM public.messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id <> v_user_id
    AND m.deleted_at IS NULL
    AND (
      m.created_at > v_target_created_at
      OR (m.created_at = v_target_created_at AND m.id::TEXT > p_message_id::TEXT)
    );

  UPDATE public.conversation_members
  SET
    last_read_message_id = p_message_id,
    unread_count = v_remaining_unread
  WHERE conversation_id = p_conversation_id
    AND user_id = v_user_id
    AND left_at IS NULL;

  IF v_remaining_unread = 0 THEN
    UPDATE public.notifications
    SET read_at = NOW()
    WHERE user_id = v_user_id
      AND type = 'chat_message'
      AND conversation_id = p_conversation_id
      AND read_at IS NULL;
  END IF;
END;
$$;

DROP FUNCTION IF EXISTS public.list_user_conversations(INTEGER, INTEGER);
CREATE FUNCTION public.list_user_conversations(
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  type public.conversation_type,
  group_id UUID,
  created_by UUID,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  unread_count INTEGER,
  muted_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.type,
    c.group_id,
    c.created_by,
    c.last_message_at,
    c.last_message_preview,
    c.metadata,
    c.created_at,
    c.updated_at,
    cm.unread_count,
    cm.muted_at,
    cm.archived_at
  FROM public.conversations c
  INNER JOIN public.conversation_members cm ON cm.conversation_id = c.id
  WHERE cm.user_id = auth.uid()
    AND cm.left_at IS NULL
    AND cm.archived_at IS NULL
    AND c.deleted_at IS NULL
    AND public.is_conversation_member(c.id, auth.uid())
  ORDER BY c.last_message_at DESC NULLS LAST, c.updated_at DESC
  LIMIT GREATEST(LEAST(COALESCE(p_limit, 50), 100), 1)
  OFFSET GREATEST(COALESCE(p_offset, 0), 0);
$$;

GRANT EXECUTE ON FUNCTION public.send_chat_message(
  UUID, TEXT, UUID, public.message_type, UUID
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_user_conversations(INTEGER, INTEGER) TO authenticated;
