-- =============================================================================
-- Chat lifecycle schema: notifications, read realtime, and role synchronization.
-- =============================================================================

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS conversation_id UUID
    REFERENCES public.conversations (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS message_id UUID
    REFERENCES public.messages (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_unique_unread_chat
  ON public.notifications (user_id, conversation_id)
  WHERE type = 'chat_message'
    AND conversation_id IS NOT NULL
    AND read_at IS NULL;

CREATE INDEX IF NOT EXISTS notifications_conversation_idx
  ON public.notifications (conversation_id, created_at DESC)
  WHERE conversation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS messages_conversation_cursor_idx
  ON public.messages (conversation_id, created_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION public.sync_group_conversation_member_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.conversation_member_role;
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  v_role := CASE NEW.role
    WHEN 'owner' THEN 'owner'::public.conversation_member_role
    WHEN 'admin' THEN 'admin'::public.conversation_member_role
    ELSE 'member'::public.conversation_member_role
  END;

  UPDATE public.conversation_members cm
  SET role = v_role
  FROM public.conversations c
  WHERE c.id = cm.conversation_id
    AND c.type = 'group'
    AND c.group_id = NEW.group_id
    AND c.deleted_at IS NULL
    AND cm.user_id = NEW.user_id
    AND cm.left_at IS NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS group_members_sync_conversation_role ON public.group_members;
CREATE TRIGGER group_members_sync_conversation_role
  AFTER UPDATE OF role ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_group_conversation_member_role();

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_members REPLICA IDENTITY FULL;

GRANT SELECT ON TABLE public.conversations TO authenticated;
GRANT SELECT ON TABLE public.conversation_members TO authenticated;
GRANT SELECT ON TABLE public.messages TO authenticated;
