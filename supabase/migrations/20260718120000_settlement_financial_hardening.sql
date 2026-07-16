-- =============================================================================
-- Migration: settlement_financial_hardening
-- Purpose: Atomic, authorized, idempotent, and overpayment-safe settlements.
-- =============================================================================

ALTER TABLE public.settlements
  ADD COLUMN IF NOT EXISTS client_settlement_id UUID;

COMMENT ON COLUMN public.settlements.client_settlement_id IS
  'Client-generated retry key. Unique per group and command creator when present.';

CREATE UNIQUE INDEX IF NOT EXISTS settlements_client_idempotency_idx
  ON public.settlements (group_id, created_by, client_settlement_id)
  WHERE client_settlement_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS settlements_from_guest_id_idx
  ON public.settlements (from_guest_id)
  WHERE from_guest_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS settlements_to_guest_id_idx
  ON public.settlements (to_guest_id)
  WHERE to_guest_id IS NOT NULL;

DROP INDEX IF EXISTS public.settlements_group_id_created_at_idx;
CREATE INDEX settlements_group_id_created_at_idx
  ON public.settlements (group_id, created_at DESC, id DESC);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE
  ON public.settlements
  FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.lock_group_financial_ledger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id UUID;
BEGIN
  v_group_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.group_id ELSE NEW.group_id END;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_group_id::TEXT, 0));

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL
  ON FUNCTION public.lock_group_financial_ledger()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS expenses_lock_financial_ledger ON public.expenses;
CREATE TRIGGER expenses_lock_financial_ledger
  BEFORE INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_group_financial_ledger();

DROP TRIGGER IF EXISTS settlements_lock_financial_ledger ON public.settlements;
CREATE TRIGGER settlements_lock_financial_ledger
  BEFORE INSERT OR UPDATE OR DELETE ON public.settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.lock_group_financial_ledger();

CREATE OR REPLACE FUNCTION public.calculate_group_net_balances(
  p_group_id UUID
)
RETURNS TABLE (
  participant_id UUID,
  net_cents BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ledger_entries AS (
    SELECT
      COALESCE(e.paid_by, e.paid_by_guest_id) AS participant_id,
      ROUND(e.amount * 100)::BIGINT AS amount_cents
    FROM public.expenses e
    WHERE e.group_id = p_group_id

    UNION ALL

    SELECT
      COALESCE(ep.user_id, ep.guest_id) AS participant_id,
      -ROUND(ep.share_amount * 100)::BIGINT AS amount_cents
    FROM public.expense_participants ep
    INNER JOIN public.expenses e ON e.id = ep.expense_id
    WHERE e.group_id = p_group_id

    UNION ALL

    SELECT
      COALESCE(s.from_user_id, s.from_guest_id) AS participant_id,
      ROUND(s.amount * 100)::BIGINT AS amount_cents
    FROM public.settlements s
    WHERE s.group_id = p_group_id

    UNION ALL

    SELECT
      COALESCE(s.to_user_id, s.to_guest_id) AS participant_id,
      -ROUND(s.amount * 100)::BIGINT AS amount_cents
    FROM public.settlements s
    WHERE s.group_id = p_group_id
  )
  SELECT
    le.participant_id,
    SUM(le.amount_cents)::BIGINT AS net_cents
  FROM ledger_entries le
  WHERE le.participant_id IS NOT NULL
  GROUP BY le.participant_id;
$$;

REVOKE ALL
  ON FUNCTION public.calculate_group_net_balances(UUID)
  FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.create_settlement(UUID, UUID, UUID, NUMERIC, TEXT);

CREATE FUNCTION public.create_settlement(
  p_group_id UUID,
  p_from_participant_id UUID,
  p_to_participant_id UUID,
  p_amount NUMERIC,
  p_notes TEXT DEFAULT NULL,
  p_client_settlement_id UUID DEFAULT NULL
)
RETURNS public.settlements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_settlement public.settlements;
  v_from_user_id UUID;
  v_from_guest_id UUID;
  v_to_user_id UUID;
  v_to_guest_id UUID;
  v_from_net_cents BIGINT := 0;
  v_to_net_cents BIGINT := 0;
  v_amount_cents BIGINT;
  v_max_settlement_cents BIGINT;
  v_normalized_notes TEXT := NULLIF(trim(p_notes), '');
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UnauthorizedSettlement: authentication required'
      USING ERRCODE = '28000';
  END IF;

  IF p_group_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.groups g WHERE g.id = p_group_id
  ) THEN
    RAISE EXCEPTION 'GroupNotFound: settlement group does not exist'
      USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.is_group_member(p_group_id, v_user_id) THEN
    RAISE EXCEPTION 'UnauthorizedSettlement: active group membership required'
      USING ERRCODE = '42501';
  END IF;

  IF p_from_participant_id IS NULL OR p_to_participant_id IS NULL THEN
    RAISE EXCEPTION 'InvalidSettlementRequest: payer and receiver are required'
      USING ERRCODE = '22023';
  END IF;

  IF p_from_participant_id = p_to_participant_id THEN
    RAISE EXCEPTION 'InvalidSettlementRequest: payer and receiver must differ'
      USING ERRCODE = '22023';
  END IF;

  IF p_amount IS NULL
    OR p_amount::TEXT IN ('NaN', 'Infinity', '-Infinity')
    OR p_amount <= 0
    OR p_amount <> ROUND(p_amount, 2)
    OR p_amount > 9999999999.99
  THEN
    RAISE EXCEPTION 'InvalidSettlementAmount: use a positive amount with at most two decimals'
      USING ERRCODE = '22023';
  END IF;

  IF p_notes IS NOT NULL AND char_length(trim(p_notes)) > 500 THEN
    RAISE EXCEPTION 'InvalidSettlementRequest: notes must be 500 characters or less'
      USING ERRCODE = '22023';
  END IF;

  IF NOT public.is_group_participant(p_group_id, p_from_participant_id)
    OR NOT public.is_group_participant(p_group_id, p_to_participant_id)
  THEN
    RAISE EXCEPTION 'InvalidSettlementRequest: participants must belong to the group'
      USING ERRCODE = '22023';
  END IF;

  IF v_user_id <> p_from_participant_id
    AND v_user_id <> p_to_participant_id
  THEN
    RAISE EXCEPTION 'SettlementNotAllowed: caller must be payer or receiver'
      USING ERRCODE = '42501';
  END IF;

  -- Every settlement in a group can affect every simplified debt in that group.
  -- A group-scoped transaction lock prevents cross-pair concurrent overpayment.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_group_id::TEXT, 0));

  IF p_client_settlement_id IS NOT NULL THEN
    SELECT s.*
    INTO v_settlement
    FROM public.settlements s
    WHERE s.group_id = p_group_id
      AND s.created_by = v_user_id
      AND s.client_settlement_id = p_client_settlement_id;

    IF FOUND THEN
      IF COALESCE(v_settlement.from_user_id, v_settlement.from_guest_id)
          <> p_from_participant_id
        OR COALESCE(v_settlement.to_user_id, v_settlement.to_guest_id)
          <> p_to_participant_id
        OR v_settlement.amount <> p_amount
        OR COALESCE(v_settlement.notes, '') <> COALESCE(v_normalized_notes, '')
      THEN
        RAISE EXCEPTION 'SettlementConflict: idempotency key was reused with different details'
          USING ERRCODE = '23505';
      END IF;

      RETURN v_settlement;
    END IF;
  END IF;

  SELECT
    COALESCE(MAX(n.net_cents) FILTER (
      WHERE n.participant_id = p_from_participant_id
    ), 0),
    COALESCE(MAX(n.net_cents) FILTER (
      WHERE n.participant_id = p_to_participant_id
    ), 0)
  INTO v_from_net_cents, v_to_net_cents
  FROM public.calculate_group_net_balances(p_group_id) n;

  IF v_from_net_cents >= 0 OR v_to_net_cents <= 0 THEN
    RAISE EXCEPTION 'OutstandingDebtNotFound: payer does not owe receiver'
      USING ERRCODE = 'P0002';
  END IF;

  v_amount_cents := ROUND(p_amount * 100)::BIGINT;
  v_max_settlement_cents := LEAST(-v_from_net_cents, v_to_net_cents);

  IF v_max_settlement_cents <= 0 THEN
    RAISE EXCEPTION 'DebtAlreadySettled: no outstanding balance remains'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_amount_cents > v_max_settlement_cents THEN
    RAISE EXCEPTION 'SettlementTooLarge: amount exceeds the remaining debt'
      USING ERRCODE = '22003';
  END IF;

  IF public.is_group_member(p_group_id, p_from_participant_id) THEN
    v_from_user_id := p_from_participant_id;
  ELSE
    v_from_guest_id := p_from_participant_id;
  END IF;

  IF public.is_group_member(p_group_id, p_to_participant_id) THEN
    v_to_user_id := p_to_participant_id;
  ELSE
    v_to_guest_id := p_to_participant_id;
  END IF;

  INSERT INTO public.settlements (
    group_id,
    from_user_id,
    from_guest_id,
    to_user_id,
    to_guest_id,
    amount,
    notes,
    created_by,
    client_settlement_id
  )
  VALUES (
    p_group_id,
    v_from_user_id,
    v_from_guest_id,
    v_to_user_id,
    v_to_guest_id,
    p_amount,
    v_normalized_notes,
    v_user_id,
    p_client_settlement_id
  )
  RETURNING * INTO v_settlement;

  RETURN v_settlement;
END;
$$;

REVOKE ALL
  ON FUNCTION public.create_settlement(UUID, UUID, UUID, NUMERIC, TEXT, UUID)
  FROM PUBLIC, anon;

GRANT EXECUTE
  ON FUNCTION public.create_settlement(UUID, UUID, UUID, NUMERIC, TEXT, UUID)
  TO authenticated;
