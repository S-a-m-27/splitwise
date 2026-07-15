-- =============================================================================
-- Migration: profile_stats_rpc
-- Purpose: Aggregate profile statistics for the authenticated user.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_profile_stats()
RETURNS TABLE (
  total_groups BIGINT,
  total_expenses BIGINT,
  total_paid NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  RETURN QUERY
  SELECT
    (
      SELECT COUNT(*)::BIGINT
      FROM public.group_members gm
      WHERE gm.user_id = v_user_id
    ) AS total_groups,
    (
      SELECT COUNT(DISTINCT e.id)::BIGINT
      FROM public.expenses e
      INNER JOIN public.group_members gm
        ON gm.group_id = e.group_id
       AND gm.user_id = v_user_id
    ) AS total_expenses,
    (
      SELECT COALESCE(SUM(e.amount), 0)::NUMERIC
      FROM public.expenses e
      WHERE e.paid_by = v_user_id
        AND EXISTS (
          SELECT 1
          FROM public.group_members gm
          WHERE gm.group_id = e.group_id
            AND gm.user_id = v_user_id
        )
    ) AS total_paid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_stats() TO authenticated;
