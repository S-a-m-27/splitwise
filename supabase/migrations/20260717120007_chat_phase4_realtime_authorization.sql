-- =============================================================================
-- Chat Phase 4: private Presence/Broadcast authorization.
-- Ephemeral activity is scoped to active conversation members and is never
-- persisted in application tables.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.chat_realtime_conversation_id(p_topic TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_id TEXT;
BEGIN
  IF p_topic !~ '^chat:activity:[0-9a-fA-F-]{36}$' THEN
    RETURN NULL;
  END IF;

  v_id := split_part(p_topic, ':', 3);
  BEGIN
    RETURN v_id::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.chat_realtime_conversation_id(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_realtime_conversation_id(TEXT) TO authenticated;

DROP POLICY IF EXISTS "chat_activity_read_member" ON realtime.messages;
CREATE POLICY "chat_activity_read_member"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    extension IN ('broadcast', 'presence')
    AND public.is_conversation_member(
      public.chat_realtime_conversation_id(realtime.topic()),
      auth.uid()
    )
  );

DROP POLICY IF EXISTS "chat_activity_write_member" ON realtime.messages;
CREATE POLICY "chat_activity_write_member"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    extension IN ('broadcast', 'presence')
    AND public.is_conversation_member(
      public.chat_realtime_conversation_id(realtime.topic()),
      auth.uid()
    )
  );

GRANT SELECT, INSERT ON TABLE realtime.messages TO authenticated;
