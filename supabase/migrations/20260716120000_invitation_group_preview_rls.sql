-- =============================================================================
-- Migration: invitation_group_preview_rls
-- Purpose: Let invitation recipients read group + inviter display info before joining.
-- =============================================================================

-- Invitees are not group_members yet, so the default groups_select_member policy
-- blocks name/icon lookups used by the notifications panel.
CREATE POLICY "groups_select_invitation_recipient"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_invitations gi
      WHERE gi.group_id = groups.id
        AND gi.kind = 'member'
        AND public.is_invitation_recipient(
          gi.invited_user_id,
          gi.invited_email,
          auth.uid()
        )
    )
  );

COMMENT ON POLICY "groups_select_invitation_recipient" ON public.groups IS
  'Invitation recipients can preview group name/icon before accepting.';

-- Inviter profile is also needed for notification copy ("Alice invited you to …").
CREATE POLICY "profiles_select_invitation_inviter"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.group_invitations gi
      WHERE gi.created_by = profiles.id
        AND gi.kind = 'member'
        AND public.is_invitation_recipient(
          gi.invited_user_id,
          gi.invited_email,
          auth.uid()
        )
    )
  );

COMMENT ON POLICY "profiles_select_invitation_inviter" ON public.profiles IS
  'Invitation recipients can read the inviter display name on pending invites.';
