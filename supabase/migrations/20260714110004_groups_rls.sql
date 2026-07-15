-- =============================================================================
-- Migration: groups_rls
-- Purpose: Row Level Security for groups, members, and invitations.
-- =============================================================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- groups
-- ---------------------------------------------------------------------------

CREATE POLICY "groups_select_member"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(id, auth.uid()));

CREATE POLICY "groups_insert_own"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "groups_update_owner"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (public.is_group_owner(id, auth.uid()))
  WITH CHECK (public.is_group_owner(id, auth.uid()));

CREATE POLICY "groups_delete_owner"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (public.is_group_owner(id, auth.uid()));

-- ---------------------------------------------------------------------------
-- group_members
-- ---------------------------------------------------------------------------

CREATE POLICY "group_members_select_same_group"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

-- Owner row is created by create_group() SECURITY DEFINER — no client INSERT for owner.
CREATE POLICY "group_members_delete_self"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND role <> 'owner'
  );

-- ---------------------------------------------------------------------------
-- group_invitations
-- ---------------------------------------------------------------------------

CREATE POLICY "group_invitations_select_member"
  ON public.group_invitations
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "group_invitations_insert_owner"
  ON public.group_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_group_owner(group_id, auth.uid()));

CREATE POLICY "group_invitations_update_owner"
  ON public.group_invitations
  FOR UPDATE
  TO authenticated
  USING (public.is_group_owner(group_id, auth.uid()))
  WITH CHECK (public.is_group_owner(group_id, auth.uid()));
