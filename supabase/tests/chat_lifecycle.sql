BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(17);

SELECT has_function(
  'public',
  'send_chat_message',
  ARRAY['uuid', 'text', 'uuid', 'public.message_type', 'uuid'],
  'transactional send RPC exists'
);
SELECT has_function(
  'public',
  'mark_conversation_read',
  ARRAY['uuid', 'uuid'],
  'transactional read RPC exists'
);
SELECT col_is_pk('public', 'messages', 'id', 'messages retain a canonical primary key');
SELECT has_index(
  'public',
  'notifications',
  'notifications_unique_unread_chat',
  'chat notifications are coalesced'
);
SELECT ok(
  position(
    'is_group_member' IN pg_get_functiondef(
      'public.send_chat_message(uuid,text,uuid,public.message_type,uuid)'::regprocedure
    )
  ) > 0,
  'group sends enforce authoritative group membership'
);

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'chat-a@example.test', '', NOW(),
    '{}', '{"full_name":"Chat A"}', NOW(), NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'chat-b@example.test', '', NOW(),
    '{}', '{"full_name":"Chat B"}', NOW(), NOW()
  );

INSERT INTO public.conversations (
  id, type, created_by, dm_pair_key
) VALUES (
  '20000000-0000-4000-8000-000000000001',
  'direct',
  '10000000-0000-4000-8000-000000000001',
  public.build_dm_pair_key(
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002'
  )
);

INSERT INTO public.conversation_members (conversation_id, user_id)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002'
  );

SELECT set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);

SELECT lives_ok(
  $$ SELECT public.send_chat_message(
    '20000000-0000-4000-8000-000000000001',
    'hello lifecycle',
    '30000000-0000-4000-8000-000000000001',
    'text',
    NULL
  ) $$,
  'active member can send'
);

SELECT is(
  (SELECT count(*)::integer FROM public.messages
   WHERE client_message_id = '30000000-0000-4000-8000-000000000001'),
  1,
  'message is persisted once'
);

SELECT lives_ok(
  $$ SELECT public.send_chat_message(
    '20000000-0000-4000-8000-000000000001',
    'hello lifecycle',
    '30000000-0000-4000-8000-000000000001',
    'text',
    NULL
  ) $$,
  'retry with the same client id is idempotent'
);

SELECT is(
  (SELECT count(*)::integer FROM public.messages
   WHERE client_message_id = '30000000-0000-4000-8000-000000000001'),
  1,
  'idempotent retry creates no duplicate'
);

SELECT is(
  (SELECT unread_count FROM public.conversation_members
   WHERE conversation_id = '20000000-0000-4000-8000-000000000001'
     AND user_id = '10000000-0000-4000-8000-000000000002'),
  1,
  'recipient unread count increments atomically'
);

SELECT is(
  (SELECT last_message_preview FROM public.conversations
   WHERE id = '20000000-0000-4000-8000-000000000001'),
  'hello lifecycle',
  'conversation preview updates atomically'
);

SELECT is(
  (SELECT count(*)::integer FROM public.notifications
   WHERE user_id = '10000000-0000-4000-8000-000000000002'
     AND conversation_id = '20000000-0000-4000-8000-000000000001'
     AND read_at IS NULL),
  1,
  'one unread notification is created'
);

SELECT set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);
SELECT lives_ok(
  format(
    'SELECT public.mark_conversation_read(%L, %L)',
    '20000000-0000-4000-8000-000000000001',
    (SELECT id FROM public.messages
     WHERE client_message_id = '30000000-0000-4000-8000-000000000001')
  ),
  'recipient can advance the read cursor'
);
SELECT is(
  (SELECT unread_count FROM public.conversation_members
   WHERE conversation_id = '20000000-0000-4000-8000-000000000001'
     AND user_id = '10000000-0000-4000-8000-000000000002'),
  0,
  'mark read resets unread count'
);
UPDATE public.conversation_members
SET muted_at = NOW()
WHERE conversation_id = '20000000-0000-4000-8000-000000000001'
  AND user_id = '10000000-0000-4000-8000-000000000002';
SELECT set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000001',
  true
);
SELECT lives_ok(
  $$ SELECT public.send_chat_message(
    '20000000-0000-4000-8000-000000000001',
    'muted delivery',
    '30000000-0000-4000-8000-000000000003',
    'text',
    NULL
  ) $$,
  'muted conversations still accept messages'
);
SELECT is(
  (SELECT count(*)::integer FROM public.notifications
   WHERE user_id = '10000000-0000-4000-8000-000000000002'
     AND conversation_id = '20000000-0000-4000-8000-000000000001'
     AND read_at IS NULL),
  0,
  'muted conversation creates no unread notification'
);

UPDATE public.conversation_members
SET left_at = NOW()
WHERE conversation_id = '20000000-0000-4000-8000-000000000001'
  AND user_id = '10000000-0000-4000-8000-000000000002';
SELECT set_config(
  'request.jwt.claim.sub',
  '10000000-0000-4000-8000-000000000002',
  true
);

SELECT throws_ok(
  $$ SELECT public.send_chat_message(
    '20000000-0000-4000-8000-000000000001',
    'denied',
    '30000000-0000-4000-8000-000000000002',
    'text',
    NULL
  ) $$,
  '42501',
  'Conversation access denied',
  'removed member cannot send'
);

SELECT * FROM finish();
ROLLBACK;
