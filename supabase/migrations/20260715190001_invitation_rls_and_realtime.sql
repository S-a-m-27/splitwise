-- =============================================================================
-- Migration: invitation_rls_and_realtime
-- Purpose: Secure member invitation visibility and prepare realtime publication.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- RLS — replace share-link-only policies with unified invitation access
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "group_invitations_select_member" ON public.group_invitations;
DROP POLICY IF EXISTS "group_invitations_insert_owner" ON public.group_invitations;
DROP POLICY IF EXISTS "group_invitations_update_owner" ON public.group_invitations;

CREATE POLICY "group_invitations_select"
  ON public.group_invitations
  FOR SELECT
  TO authenticated
  USING (
    (
      kind = 'share_link'
      AND public.is_group_member(group_id, auth.uid())
    )
    OR (
      kind = 'member'
      AND (
        public.is_group_admin_or_owner(group_id, auth.uid())
        OR public.is_invitation_recipient(invited_user_id, invited_email, auth.uid())
      )
    )
  );

-- Share-link rows may still be inserted/updated by owners (regenerate flow).
-- Member invitations are created exclusively via SECURITY DEFINER RPCs.
CREATE POLICY "group_invitations_insert_share_link_owner"
  ON public.group_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    kind = 'share_link'
    AND public.is_group_owner(group_id, auth.uid())
  );

CREATE POLICY "group_invitations_update_share_link_owner"
  ON public.group_invitations
  FOR UPDATE
  TO authenticated
  USING (
    kind = 'share_link'
    AND public.is_group_owner(group_id, auth.uid())
  )
  WITH CHECK (
    kind = 'share_link'
    AND public.is_group_owner(group_id, auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Realtime foundation (no client subscription yet)
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'group_invitations'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.group_invitations;
    END IF;
  END IF;
END;
$$;

COMMENT ON TABLE public.group_invitations IS
  'Unified invitation entity: share_link (reusable) and member (directed lifecycle).';
