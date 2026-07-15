-- =============================================================================
-- Migration: expenses_rls
-- Purpose: Group members can read and manage expenses in their groups.
-- =============================================================================

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------

CREATE POLICY "expenses_select_member"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "expenses_insert_member"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_group_member(group_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "expenses_update_member"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()))
  WITH CHECK (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "expenses_delete_member"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

-- ---------------------------------------------------------------------------
-- expense_participants
-- ---------------------------------------------------------------------------

CREATE POLICY "expense_participants_select_member"
  ON public.expense_participants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.expenses e
      WHERE e.id = expense_id
        AND public.is_group_member(e.group_id, auth.uid())
    )
  );

-- Participant rows are written by create_expense / update_expense (SECURITY DEFINER).
-- Direct client writes are blocked — no INSERT/UPDATE/DELETE policies for authenticated.
