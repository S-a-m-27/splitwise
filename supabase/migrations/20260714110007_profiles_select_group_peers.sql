-- =============================================================================
-- Migration: profiles_select_group_peers
-- Purpose: Allow group members to read each other's display names and avatars.
-- =============================================================================

CREATE POLICY "profiles_select_group_peers"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_members gm_self
      INNER JOIN public.group_members gm_peer
        ON gm_self.group_id = gm_peer.group_id
      WHERE gm_self.user_id = auth.uid()
        AND gm_peer.user_id = profiles.id
    )
  );

COMMENT ON POLICY "profiles_select_group_peers" ON public.profiles IS
  'Group members can view profiles of other members in shared groups.';
