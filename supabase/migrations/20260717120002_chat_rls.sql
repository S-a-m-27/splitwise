-- =============================================================================
-- Migration: chat_rls
-- Purpose: Member-only read access. Writes via SECURITY DEFINER RPCs/triggers only.
-- Depends on: 20260717120001_chat_helpers_and_rpcs
-- =============================================================================

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_audit_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------

CREATE POLICY "conversations_select_member"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (public.is_conversation_member(id, auth.uid()));

-- No client INSERT/UPDATE/DELETE — created by RPCs and group triggers.

-- ---------------------------------------------------------------------------
-- conversation_members
-- ---------------------------------------------------------------------------

CREATE POLICY "conversation_members_select_member"
  ON public.conversation_members
  FOR SELECT
  TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));

-- Membership mutations only via SECURITY DEFINER triggers/RPCs.

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------

CREATE POLICY "messages_select_member"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.is_conversation_member(conversation_id, auth.uid())
  );

-- Phase 1: no client INSERT/UPDATE/DELETE on messages.

-- ---------------------------------------------------------------------------
-- message_reads
-- ---------------------------------------------------------------------------

CREATE POLICY "message_reads_select_member"
  ON public.message_reads
  FOR SELECT
  TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));

-- Phase 2: read receipt writes via RPC.

-- ---------------------------------------------------------------------------
-- chat_audit_events — no client access (service/trigger only)
-- ---------------------------------------------------------------------------

-- Intentionally no SELECT policy for authenticated users.

COMMENT ON TABLE public.conversations IS
  'Unified chat conversations. RLS: members only. Writes via RPCs/triggers.';

COMMENT ON TABLE public.messages IS
  'Chat messages. RLS: members read only in Phase 1. Sends via RPC in Phase 2.';
