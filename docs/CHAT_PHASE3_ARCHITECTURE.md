# Chat Phase 3 — Conversation Lifecycle Architecture

## Authority and boundaries

Committed PostgreSQL state is authoritative. Realtime messages are notifications of committed
changes; Broadcast is used only for ephemeral typing state.

The dependency direction is:

`components -> hooks/view models -> ChatLifecycleService -> sibling services -> Supabase`

- `ChatLifecycleService` coordinates opening, hydration, commands, reconciliation, and cleanup.
- `ConversationService`, `MessageService`, and the shared notification service own database/RPC
  access.
- `ChatRealtimeService` owns filtered Postgres Changes and Broadcast channels and emits typed
  domain events. It never mutates TanStack Query directly.
- Pure state transitions, permissions, cache reconciliation, commands, and events live under the
  chat domain/cache folders.
- ESLint prevents chat components and hooks from importing the Supabase client.

## Lifecycle

A thread moves through `idle -> opening -> hydrating -> ready`, with `reconnecting`, `error`, and
`closed` terminal/recovery paths.

The thread channel subscribes before snapshot hydration. Events received during hydration are
buffered, then reconciled by canonical message ID or `client_message_id`. Closing or switching a
thread removes its channel.

The inbox channel receives visible conversation updates and the current user's membership updates.
Its events update only the matching conversation cache entry and then re-sort the inbox.

## Command pipeline

`send_chat_message` validates authentication, active conversation membership, group membership,
message type/content, and reply ownership. In one transaction it:

1. inserts idempotently by sender/conversation/client message ID;
2. updates conversation preview and ordering timestamps;
3. increments recipient unread counts;
4. coalesces one unread notification per recipient/conversation unless muted;
5. writes an audit event; and
6. returns the canonical row.

`mark_conversation_read` atomically advances the member read cursor, resets unread count, upserts a
read receipt, and clears the coalesced notification.

Clients have no direct message insert/update policy. RPC and RLS checks remain authoritative;
client permission checks are presentation hints only.

## Optimistic and failure behavior

The client creates a UUID `client_message_id`, stages a sending message, and calls the send RPC.
The RPC response and the subsequent realtime insert reconcile into the same cache entry. A failed
command remains visible with a retry action using the same client ID, preserving idempotency across
network retries and offline replays.

Unknown or malformed events may be invalidated and refetched; recognized events are applied
precisely without a global cache reset.

## Verification

- Pure Vitest coverage verifies lifecycle buffering, optimistic/canonical deduplication, and unread
  cache updates.
- `supabase/tests/chat_lifecycle.sql` covers RPC availability, idempotency, preview/unread updates,
  notification coalescing, mute behavior, read receipts, and removed-member denial.
- Required release checks: typecheck, lint, targeted tests, production build, local Supabase
  database tests, and a two-browser authenticated exchange verifying send, ordering, unread, read,
  reconnect, and cleanup behavior.
