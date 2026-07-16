-- =============================================================================
-- Migration: chat_member_identity
-- Purpose: Securely expose chat member identities to active conversation peers.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.can_view_chat_profile(
  p_profile_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.conversation_members peer
      WHERE peer.user_id = p_profile_user_id
        AND peer.left_at IS NULL
        AND public.is_conversation_member(peer.conversation_id, auth.uid())
        AND public.is_conversation_member(peer.conversation_id, p_profile_user_id)
    );
$$;

REVOKE ALL ON FUNCTION public.can_view_chat_profile(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_chat_profile(UUID) TO authenticated;

CREATE POLICY "profiles_select_conversation_peers"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.can_view_chat_profile(id));

COMMENT ON POLICY "profiles_select_conversation_peers" ON public.profiles IS
  'Active conversation members can read peer names and avatars; emails remain protected.';

CREATE OR REPLACE FUNCTION public.get_conversation_member_details(
  p_conversation_id UUID
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  user_id UUID,
  role public.conversation_member_role,
  joined_at TIMESTAMPTZ,
  last_read_message_id UUID,
  unread_count INTEGER,
  muted_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL
    OR NOT public.is_conversation_member(p_conversation_id, auth.uid())
  THEN
    RAISE EXCEPTION 'CHAT_PERMISSION_DENIED';
  END IF;

  RETURN QUERY
  SELECT
    cm.id,
    cm.conversation_id,
    cm.user_id,
    cm.role,
    cm.joined_at,
    cm.last_read_message_id,
    cm.unread_count,
    cm.muted_at,
    cm.archived_at,
    cm.left_at,
    p.full_name,
    p.avatar_url,
    u.email::TEXT
  FROM public.conversation_members cm
  INNER JOIN public.profiles p ON p.id = cm.user_id
  INNER JOIN auth.users u ON u.id = cm.user_id
  WHERE cm.conversation_id = p_conversation_id
    AND cm.left_at IS NULL
    AND public.is_conversation_member(cm.conversation_id, cm.user_id)
  ORDER BY cm.joined_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_conversation_member_details(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conversation_member_details(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_conversation_member_details(UUID) IS
  'Returns active member identities, including protected email, only to active members of that conversation.';
