BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(4);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'settlements'
  ),
  'settlements are published to Supabase Realtime'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'settlements'
      AND policyname = 'settlements_select_member'
      AND cmd = 'SELECT'
  ),
  'settlement realtime reads are protected by member RLS'
);

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '12000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'realtime-member@example.test', '', NOW(),
    '{}', '{"full_name":"Realtime Member"}', NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '12000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'realtime-peer@example.test', '', NOW(),
    '{}', '{"full_name":"Realtime Peer"}', NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '12000000-0000-4000-8000-000000000003',
    'authenticated', 'authenticated', 'realtime-outsider@example.test', '', NOW(),
    '{}', '{"full_name":"Realtime Outsider"}', NOW(), NOW()
  );

INSERT INTO public.groups (
  id, name, icon, type, invite_code, created_by
) VALUES (
  '22000000-0000-4000-8000-000000000001',
  'Realtime Settlement Test',
  'R',
  'other',
  'realtime-settlement-test',
  '12000000-0000-4000-8000-000000000001'
);

INSERT INTO public.group_members (group_id, user_id, role)
VALUES
  (
    '22000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001',
    'owner'
  ),
  (
    '22000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000002',
    'member'
  );

INSERT INTO public.settlements (
  id,
  group_id,
  from_user_id,
  to_user_id,
  amount,
  created_by,
  client_settlement_id
) VALUES (
  '32000000-0000-4000-8000-000000000001',
  '22000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000001',
  '12000000-0000-4000-8000-000000000002',
  10.00,
  '12000000-0000-4000-8000-000000000001',
  '42000000-0000-4000-8000-000000000001'
);

SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '12000000-0000-4000-8000-000000000001',
  true
);
SELECT is(
  (SELECT count(*)::INTEGER FROM public.settlements),
  1,
  'group members can select settlement rows for realtime delivery'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '12000000-0000-4000-8000-000000000003',
  true
);
SELECT is(
  (SELECT count(*)::INTEGER FROM public.settlements),
  0,
  'non-members cannot select settlement rows for realtime delivery'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
