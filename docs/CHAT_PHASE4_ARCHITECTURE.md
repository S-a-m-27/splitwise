# Chat Phase 4: Realtime Collaboration

## Scope

Phase 4 extends the conversation lifecycle with ephemeral activity and resilient
cross-client synchronization:

- Supabase Presence for online members
- Supabase Broadcast for typing activity
- Postgres Changes for durable messages, conversation metadata, membership,
  unread counts, and read cursors
- reconnect recovery with a fresh authoritative snapshot
- live inbox ordering and badge updates

Components and hooks remain isolated from Supabase. All realtime operations pass
through `ChatRealtimeService`, while `ChatLifecycleService` coordinates
subscriptions, hydration, commands, recovery, and cleanup.

## Channel model

Conversation data and activity use separate channels:

- `chat:conversation:<conversationId>` carries durable Postgres changes.
- `conversation:<conversationId>` carries Presence and typing Broadcast events.
- `chat:inbox:<userId>` synchronizes the signed-in user's conversation list.

Realtime authorization policies derive the conversation ID from the activity
topic and require active conversation membership for reads and writes.

## Presence and typing

Presence tracks authenticated user IDs and maps them to existing conversation
participants. Direct-message cards expose online/offline state; group
conversations expose an online count.

Typing payloads are schema-validated and ignored when they are stale, malformed,
or sent by the current user. Outbound typing events are deduplicated, throttled,
and automatically stopped after an idle timeout. Timers and ephemeral state are
cleared when a conversation closes or a channel disconnects.

## Read and unread synchronization

`mark_conversation_read` remains the authoritative read command. It:

- verifies authentication and active membership
- verifies that the message belongs to the conversation
- prevents a read cursor from moving backward
- counts messages newer than the requested cursor instead of blindly clearing
  unread state
- clears the coalesced chat notification only when no unread messages remain

Membership changes update inbox unread badges precisely. Unknown membership
inserts invalidate the inbox query so newly created conversations appear without
a reload. Conversation preview changes preserve member-specific unread state.

## Recovery and cleanup

Channel errors transition the lifecycle to `reconnecting`. Supabase owns the
transport retry; when the channel reconnects, the lifecycle reloads the
conversation snapshot and applies it through the `RECOVERED` action. Recovery
uses bounded exponential backoff and is guarded by the active conversation ID.

Conversation opens also use a generation guard so a stale request cannot
overwrite a newer conversation after rapid navigation. Every subscription is
reference-counted or explicitly removed when its final listener leaves.

## UI behavior

- Typing status uses an accessible live region.
- Presence is included in direct-message labels and existing avatar badges.
- Message lists preserve scroll position while prepending history.
- New remote messages auto-scroll only when the reader is already near the
  bottom; sending an own message still scrolls to it.
- Reconnecting state disables message composition until synchronization
  recovers.

## Verification

Phase 4 was checked with:

- `npm run typecheck`
- focused ESLint validation for chat and notification files

No local Supabase reset or two-client integration run was performed.
