-- =============================================================================
-- Migration: chat_receipts_edit_delete
-- Purpose: Per-message read receipts, edit window, and soft-delete own messages.
-- =============================================================================

ALTER TABLE public.message_reads REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS message_reads_message_id_idx
  ON public.message_reads (message_id, read_at DESC);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'message_reads'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;
    END IF;
  END IF;
END;
$$;

GRANT SELECT ON TABLE public.message_reads TO authenticated;

-- Allow members to see soft-deleted message tombstones.
DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
CREATE POLICY "messages_select_member"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));

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

  INSERT INTO public.message_reads (
    conversation_id,
    user_id,
    message_id,
    read_at
  )
  SELECT
    p_conversation_id,
    v_user_id,
    m.id,
    NOW()
  FROM public.messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id <> v_user_id
    AND m.deleted_at IS NULL
    AND (
      m.created_at < v_target_created_at
      OR (
        m.created_at = v_target_created_at
        AND m.id::TEXT <= p_message_id::TEXT
      )
    )
    AND (
      v_current_created_at IS NULL
      OR m.created_at > v_current_created_at
      OR (
        m.created_at = v_current_created_at
        AND m.id::TEXT > v_current_message_id::TEXT
      )
    )
  ON CONFLICT (user_id, message_id) DO NOTHING;

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

CREATE OR REPLACE FUNCTION public.edit_chat_message(
  p_message_id UUID,
  p_content TEXT
)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_message public.messages;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF p_content IS NULL OR char_length(trim(p_content)) = 0 THEN
    RAISE EXCEPTION 'Message cannot be empty' USING ERRCODE = '22023';
  END IF;

  IF char_length(trim(p_content)) > 4000 THEN
    RAISE EXCEPTION 'Message exceeds 4000 characters' USING ERRCODE = '22001';
  END IF;

  SELECT m.*
  INTO v_message
  FROM public.messages m
  WHERE m.id = p_message_id
    AND m.deleted_at IS NULL
  FOR UPDATE;

  IF v_message.id IS NULL THEN
    RAISE EXCEPTION 'Message not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_message.sender_id <> v_user_id THEN
    RAISE EXCEPTION 'Only the sender can edit this message' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_conversation_member(v_message.conversation_id, v_user_id) THEN
    RAISE EXCEPTION 'Conversation access denied' USING ERRCODE = '42501';
  END IF;

  IF v_message.created_at < NOW() - INTERVAL '5 minutes' THEN
    RAISE EXCEPTION 'Edit window expired' USING ERRCODE = '22023';
  END IF;

  IF v_message.message_type <> 'text' THEN
    RAISE EXCEPTION 'Only text messages can be edited' USING ERRCODE = '22023';
  END IF;

  UPDATE public.messages
  SET
    content = trim(p_content),
    edited_at = NOW(),
    updated_at = NOW()
  WHERE id = p_message_id
  RETURNING * INTO v_message;

  UPDATE public.conversations
  SET last_message_preview = left(trim(p_content), 280)
  WHERE id = v_message.conversation_id
    AND last_message_at IS NOT DISTINCT FROM v_message.created_at;

  PERFORM public.log_chat_audit_event(
    v_message.conversation_id,
    v_user_id,
    'message_updated',
    jsonb_build_object('message_id', v_message.id)
  );

  RETURN v_message;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_chat_message(
  p_message_id UUID
)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_message public.messages;
  v_preview TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT m.*
  INTO v_message
  FROM public.messages m
  WHERE m.id = p_message_id
    AND m.deleted_at IS NULL
  FOR UPDATE;

  IF v_message.id IS NULL THEN
    RAISE EXCEPTION 'Message not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_message.sender_id <> v_user_id THEN
    RAISE EXCEPTION 'Only the sender can delete this message' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_conversation_member(v_message.conversation_id, v_user_id) THEN
    RAISE EXCEPTION 'Conversation access denied' USING ERRCODE = '42501';
  END IF;

  UPDATE public.messages
  SET
    content = NULL,
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = p_message_id
  RETURNING * INTO v_message;

  SELECT left(m.content, 280)
  INTO v_preview
  FROM public.messages m
  WHERE m.conversation_id = v_message.conversation_id
    AND m.deleted_at IS NULL
  ORDER BY m.created_at DESC, m.id DESC
  LIMIT 1;

  UPDATE public.conversations c
  SET
    last_message_preview = COALESCE(v_preview, 'This message was deleted'),
    last_message_at = COALESCE(
      (
        SELECT m.created_at
        FROM public.messages m
        WHERE m.conversation_id = v_message.conversation_id
          AND m.deleted_at IS NULL
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT 1
      ),
      c.last_message_at
    )
  WHERE c.id = v_message.conversation_id
    AND c.last_message_at IS NOT DISTINCT FROM v_message.created_at;

  PERFORM public.log_chat_audit_event(
    v_message.conversation_id,
    v_user_id,
    'message_deleted',
    jsonb_build_object('message_id', v_message.id)
  );

  RETURN v_message;
END;
$$;

REVOKE ALL ON FUNCTION public.edit_chat_message(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_chat_message(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.edit_chat_message(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_chat_message(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_conversation_read(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.edit_chat_message(UUID, TEXT) IS
  'Allows the sender to edit a text message within 5 minutes of sending.';

COMMENT ON FUNCTION public.delete_chat_message(UUID) IS
  'Soft-deletes a message for everyone; only the sender may delete.';
