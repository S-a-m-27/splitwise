-- =============================================================================
-- Migration: settlements_rls
-- Purpose: Group members can read settlements in their groups.
-- =============================================================================

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlements_select_member"
  ON public.settlements
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

-- Settlement rows are inserted via create_settlement (SECURITY DEFINER).
