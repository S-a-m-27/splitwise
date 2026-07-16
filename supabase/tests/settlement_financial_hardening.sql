BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(19);

SELECT has_function(
  'public',
  'create_settlement',
  ARRAY['uuid', 'uuid', 'uuid', 'numeric', 'text', 'uuid'],
  'hardened settlement command exists'
);
SELECT has_column(
  'public',
  'settlements',
  'client_settlement_id',
  'settlements store a client retry key'
);
SELECT has_index(
  'public',
  'settlements',
  'settlements_client_idempotency_idx',
  'settlement retry keys are unique'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.settlements', 'UPDATE'),
  'authenticated users cannot mutate settlement history'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.settlements', 'DELETE'),
  'authenticated users cannot delete settlement history'
);
SELECT ok(
  position(
    'pg_advisory_xact_lock' IN pg_get_functiondef(
      'public.create_settlement(uuid,uuid,uuid,numeric,text,uuid)'::regprocedure
    )
  ) > 0,
  'settlement command serializes writes for a group'
);

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '11000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'settle-a@example.test', '', NOW(),
    '{}', '{"full_name":"Settlement A"}', NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'settle-b@example.test', '', NOW(),
    '{}', '{"full_name":"Settlement B"}', NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '11000000-0000-4000-8000-000000000003',
    'authenticated', 'authenticated', 'settle-c@example.test', '', NOW(),
    '{}', '{"full_name":"Settlement C"}', NOW(), NOW()
  );

INSERT INTO public.groups (
  id, name, icon, type, invite_code, created_by
) VALUES (
  '21000000-0000-4000-8000-000000000001',
  'Settlement Test',
  'T',
  'other',
  'settlement-test',
  '11000000-0000-4000-8000-000000000001'
);

INSERT INTO public.group_members (group_id, user_id, role)
VALUES
  (
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    'owner'
  ),
  (
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    'member'
  );

INSERT INTO public.group_guests (
  id, group_id, display_name, created_by
) VALUES (
  '31000000-0000-4000-8000-000000000001',
  '21000000-0000-4000-8000-000000000001',
  'Settlement Guest',
  '11000000-0000-4000-8000-000000000001'
);

INSERT INTO public.expenses (
  id, group_id, title, amount, paid_by, paid_by_guest_id, split_type, created_by
) VALUES
  (
    '41000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    'Member expense',
    100.00,
    '11000000-0000-4000-8000-000000000002',
    NULL,
    'equal',
    '11000000-0000-4000-8000-000000000001'
  ),
  (
    '41000000-0000-4000-8000-000000000002',
    '21000000-0000-4000-8000-000000000001',
    'Guest expense',
    20.00,
    NULL,
    '31000000-0000-4000-8000-000000000001',
    'equal',
    '11000000-0000-4000-8000-000000000001'
  );

INSERT INTO public.expense_participants (
  expense_id, user_id, guest_id, share_amount
) VALUES
  (
    '41000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    NULL,
    50.00
  ),
  (
    '41000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    NULL,
    50.00
  ),
  (
    '41000000-0000-4000-8000-000000000002',
    '11000000-0000-4000-8000-000000000001',
    NULL,
    10.00
  ),
  (
    '41000000-0000-4000-8000-000000000002',
    NULL,
    '31000000-0000-4000-8000-000000000001',
    10.00
  );

SELECT set_config(
  'request.jwt.claim.sub',
  '11000000-0000-4000-8000-000000000001',
  true
);

SELECT lives_ok(
  $$ SELECT public.create_settlement(
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    20.00,
    'first payment',
    '51000000-0000-4000-8000-000000000001'
  ) $$,
  'a partial settlement succeeds'
);
SELECT is(
  (SELECT count(*)::INTEGER FROM public.settlements
   WHERE client_settlement_id = '51000000-0000-4000-8000-000000000001'),
  1,
  'partial settlement is stored once'
);
SELECT lives_ok(
  $$ SELECT public.create_settlement(
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    20.00,
    'first payment',
    '51000000-0000-4000-8000-000000000001'
  ) $$,
  'same-key same-payload retry succeeds'
);
SELECT is(
  (SELECT count(*)::INTEGER FROM public.settlements
   WHERE client_settlement_id = '51000000-0000-4000-8000-000000000001'),
  1,
  'idempotent retry creates no duplicate'
);
SELECT throws_ok(
  $$ SELECT public.create_settlement(
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    21.00,
    'changed',
    '51000000-0000-4000-8000-000000000001'
  ) $$,
  '23505',
  'SettlementConflict: idempotency key was reused with different details',
  'same key cannot represent different settlement details'
);
SELECT throws_ok(
  $$ SELECT public.create_settlement(
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    30.01,
    NULL,
    '51000000-0000-4000-8000-000000000002'
  ) $$,
  '22003',
  'SettlementTooLarge: amount exceeds the remaining debt',
  'settlement cannot exceed remaining creditor capacity'
);
SELECT throws_ok(
  $$ SELECT public.create_settlement(
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    1.001,
    NULL,
    '51000000-0000-4000-8000-000000000003'
  ) $$,
  '22023',
  'InvalidSettlementAmount: use a positive amount with at most two decimals',
  'amount precision is validated on the server'
);
SELECT throws_ok(
  $$ SELECT public.create_settlement(
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    '11000000-0000-4000-8000-000000000001',
    1.00,
    NULL,
    '51000000-0000-4000-8000-000000000004'
  ) $$,
  'P0002',
  'OutstandingDebtNotFound: payer does not owe receiver',
  'wrong-direction settlements are rejected'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '11000000-0000-4000-8000-000000000003',
  true
);
SELECT throws_ok(
  $$ SELECT public.create_settlement(
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    1.00,
    NULL,
    '51000000-0000-4000-8000-000000000005'
  ) $$,
  '42501',
  'UnauthorizedSettlement: active group membership required',
  'non-members cannot record settlements'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '11000000-0000-4000-8000-000000000001',
  true
);
SELECT lives_ok(
  $$ SELECT public.create_settlement(
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000002',
    30.00,
    NULL,
    '51000000-0000-4000-8000-000000000006'
  ) $$,
  'the remaining member balance can be settled exactly'
);
SELECT lives_ok(
  $$ SELECT public.create_settlement(
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    10.00,
    NULL,
    '51000000-0000-4000-8000-000000000007'
  ) $$,
  'a member can settle an outstanding guest balance'
);
SELECT is(
  (
    SELECT SUM(net_cents)::BIGINT
    FROM public.calculate_group_net_balances(
      '21000000-0000-4000-8000-000000000001'
    )
  ),
  0::BIGINT,
  'the group ledger remains balanced'
);
SELECT throws_ok(
  $$ SELECT public.create_settlement(
    '21000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    1.00,
    NULL,
    '51000000-0000-4000-8000-000000000008'
  ) $$,
  'P0002',
  'OutstandingDebtNotFound: payer does not owe receiver',
  'an already-settled balance cannot be settled again'
);

SELECT * FROM finish();
ROLLBACK;
