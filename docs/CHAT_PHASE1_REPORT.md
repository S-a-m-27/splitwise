# Chat System — Phase 1 Backend Architecture Report

**Date:** July 2026  
**Scope:** Database schema, RLS, domain services, validation, and permissions. No UI, realtime subscriptions, or message sending.

---

## 1. Existing Architecture Review

### Feature-based layout

The app uses a **feature-module pattern** (`frontend/src/features/<domain>/`) with:

| Layer | Convention | Examples |
|-------|------------|----------|
| Types | `types/index.ts` | Domain view models |
| Validation | `validation/*.schema.ts` | Zod schemas |
| Errors | `services/*.errors.ts` | Normalized error codes + mappers |
| Services | `services/*.service.ts` | Supabase reads/writes via RPC or RLS |
| Utils | `utils/map-*.ts` | DB row → domain mappers |
| Constants | `constants/query-keys.ts` | React Query keys (Phase 2) |

**Tier A** modules (`groups`, `expenses`, `settlements`) use direct Supabase table reads guarded by RLS plus SECURITY DEFINER RPCs for mutations.

**Tier B** (`invitations`) adds Edge Functions and realtime publication — **not modified** in this phase.

### Reused primitives

| Primitive | Location | Chat usage |
|-----------|----------|------------|
| `is_group_member` | `groups_helpers.sql` | Group chat access gate inside `is_conversation_member` |
| `create_group` | `invitation_domain_schema.sql` | Extended to call `create_group_conversation` |
| `authService.getCurrentUser` | `features/auth` | Session guard in all chat services |
| `handle_updated_at` | `profiles_updated_at.sql` | `conversations` / `messages` triggers |
| Realtime publication pattern | `invitation_rls_and_realtime.sql` | Same DO block for chat tables |
| Error normalization pattern | `groups.errors.ts` | Mirrored in `chat.errors.ts` |

### Membership model

- **Accepted group members** live in `group_members` (inserted on invite accept via existing RPCs).
- **Pending invitees** are never in `group_members` → they cannot pass `is_group_member` → no chat access.
- Chat membership sync uses **`AFTER INSERT/DELETE` triggers on `group_members`** — the Invitation System frontend/edge code is untouched.

---

## 2. Database Changes

Four new migrations (in order):

| Migration | Purpose |
|-----------|---------|
| `20260717120000_chat_domain_schema.sql` | Enums, core tables, indexes |
| `20260717120001_chat_helpers_and_rpcs.sql` | Helpers, DM dedup, read RPCs |
| `20260717120002_chat_rls.sql` | Member-only SELECT policies |
| `20260717120003_chat_group_integration.sql` | `create_group` hook, triggers, backfill, realtime prep |

---

## 3. New Tables

### `conversations`

Unified conversation entity for group, direct, and future channel types.

| Column | Notes |
|--------|-------|
| `type` | `group`, `direct`, `announcement`, `community` |
| `group_id` | Required for `group`; FK to `groups` |
| `dm_pair_key` | `min_uuid:max_uuid` for direct dedup |
| `last_message_at` / `last_message_preview` | Denormalized inbox ordering (Phase 2 writes) |
| `deleted_at` | Soft delete / archive |

### `conversation_members`

Per-user membership, read cursor, unread count, future mute/archive.

### `messages`

UUID primary keys. `client_message_id` for offline idempotency. `message_type` enum for future payloads. Soft delete via `deleted_at`.

### `message_reads`

Read receipt storage — schema only in Phase 1.

### `chat_audit_events`

Append-only audit trail for moderation/compliance (written by triggers/RPCs only).

---

## 4. Relationships

```
groups (1) ──< (1) conversations [type=group, unique partial index]
groups (1) ──< (*) group_members ──trigger──> conversation_members

profiles (1) ──< (*) conversation_members
conversations (1) ──< (*) conversation_members
conversations (1) ──< (*) messages
messages (1) ──< (*) message_reads
conversations (1) ──< (*) message_reads
conversations (1) ──< (*) chat_audit_events

messages.reply_to_message_id → messages (self-FK, replies Phase 2+)
conversation_members.last_read_message_id → messages
```

**DM dedup:** `dm_pair_key` unique partial index ensures one active direct conversation per user pair.

**One group conversation:** `conversations_one_active_group` unique index on `group_id` where `type = 'group'`.

---

## 5. Indexes Added

| Index | Table | Purpose |
|-------|-------|---------|
| `conversations_one_active_group` | conversations | One chat per group |
| `conversations_one_active_direct_pair` | conversations | No duplicate DMs |
| `conversations_last_message_at_idx` | conversations | Inbox ordering |
| `conversations_created_by_idx` | conversations | Creator lookups |
| `conversation_members_user_active_idx` | conversation_members | User inbox |
| `conversation_members_conversation_active_idx` | conversation_members | Member lists |
| `messages_client_idempotency_idx` | messages | PWA offline dedup |
| `messages_conversation_created_idx` | messages | Paginated history |
| `messages_sender_idx` | messages | Sender history |
| `message_reads_conversation_user_idx` | message_reads | Read state |
| `chat_audit_events_conversation_idx` | chat_audit_events | Audit queries |

---

## 6. RLS Policies

All chat tables have RLS enabled.

| Table | Client access (Phase 1) |
|-------|-------------------------|
| `conversations` | SELECT if `is_conversation_member(id)` |
| `conversation_members` | SELECT if `is_conversation_member(conversation_id)` |
| `messages` | SELECT if member + `deleted_at IS NULL` |
| `message_reads` | SELECT if member |
| `chat_audit_events` | **No client policy** (internal only) |

**No client INSERT/UPDATE/DELETE** on conversations, members, or messages in Phase 1. Writes will go through SECURITY DEFINER RPCs in Phase 2.

### `is_conversation_member` security gate

For `type = 'group'`, membership requires:

1. Active `conversation_members` row (`left_at IS NULL`)
2. Active conversation (`deleted_at IS NULL`)
3. **`is_group_member(group_id)`** — removed users lose access immediately

---

## 7. Services Created

Location: `frontend/src/features/chat/`

| Service | Responsibility | Phase 1 surface |
|---------|----------------|-----------------|
| `ChatPermissionService` | Centralized authorization | `resolveContextForUser`, `assertCanView`, `assertCanSend` |
| `ConversationService` | Conversation reads | `listConversations`, `getConversation`, `getGroupConversation`, `getOrCreateDirectConversation`, `listConversationMembers` |
| `MessageService` | Message reads | `listMessages`, `getMessage` |
| `ReadReceiptService` | Receipt reads | `listReadReceipts` |

Domain permissions (pure functions): `domain/chat-permissions.ts`

---

## 8. Validation Layer

`validation/chat.schema.ts` (Zod):

- `conversationTypeSchema`, `messageTypeSchema`
- `listConversationsSchema`, `listMessagesSchema`
- `directConversationSchema`
- `messageContentSchema` (max 4000 chars — matches DB constraint)
- `buildDmPairKey()` — mirrors SQL `build_dm_pair_key`

---

## 9. Domain Errors

`services/chat.errors.ts`:

| Class / Code | When |
|--------------|------|
| `ConversationNotFoundError` | Missing or inaccessible conversation |
| `UnauthorizedConversationAccessError` | Failed permission check |
| `DuplicateConversationError` | DM already exists (client-side guard) |
| `AlreadyConversationMemberError` | Duplicate membership |
| `MessageTooLongError` | Content exceeds limit |
| `InvalidConversationTypeError` | Unsupported type |
| `ChatServiceError` + `normalizeChatError` | Supabase/Postgres mapping |

---

## 10. Future Expansion Support

| Future feature | Preparation |
|----------------|-------------|
| **Attachments** | `message_type` enum + `metadata` JSONB |
| **Voice notes** | `message_type = 'voice'` |
| **Reactions** | `metadata` or future `message_reactions` table |
| **Replies** | `reply_to_message_id` FK already present |
| **Pinned messages** | `metadata` on conversation or future table |
| **Message editing** | `edited_at`, `updated_at` columns |
| **Read receipts** | `message_reads` + `last_read_message_id` + `unread_count` |
| **Typing / presence** | Supabase Realtime Presence — not stored in DB |
| **Announcement channels** | `conversation_type = 'announcement'` + read-only permission in `chat-permissions.ts` |
| **Community spaces** | `conversation_type = 'community'` |
| **Offline PWA sync** | UUID message PK + `client_message_id` unique index |
| **Realtime** | Tables added to `supabase_realtime` publication |
| **Audit** | `chat_audit_events` + `log_chat_audit_event()` |

### Architectural decisions (per requirements)

1. **One conversation per group** — created in `create_group`, never recreated; group rename irrelevant.
2. **No duplicate DMs** — `get_or_create_direct_conversation` + `dm_pair_key` unique index.
3. **UUID message IDs** — client-generated IDs safe for offline queue.
4. **Centralized permissions** — `ChatPermissionService` + `chat-permissions.ts`.
5. **Invitation system untouched** — membership via `group_members` triggers only.

### RPCs ready for Phase 2

Phase 2 will add (not yet implemented):

- `send_message(p_conversation_id, p_content, p_client_message_id?)`
- `edit_message` / `soft_delete_message`
- `mark_conversation_read`
- Unread counter triggers on message insert

---

## 11. Recommendations Before Phase 2

### Database

1. Run `supabase db push` (or apply migrations in CI) before frontend work.
2. Add `send_message` RPC with:
   - Permission check via `is_conversation_member`
   - `ChatPermissionService.assertCanSend` mirror on server
   - Trigger to update `conversations.last_message_at`, `last_message_preview`, and member `unread_count`
3. Consider `REPLICA IDENTITY FULL` on `messages` if realtime needs old record on UPDATE/DELETE.

### Frontend

1. Add React Query hooks (`useConversations`, `useMessages`) using `chatQueryKeys`.
2. Wire `useRealtimeSync` (existing pattern) to `messages` and `conversation_members`.
3. Build mobile-first chat UI as a new route under `(app)/chat` or embedded in group detail tab.
4. For PWA offline: local IndexedDB queue keyed by `client_message_id`; replay via `send_message` RPC on reconnect.

### Security

1. Keep all message writes behind RPCs — never add client INSERT policies on `messages`.
2. Rate-limit `send_message` at Edge or via Postgres extension in production.
3. Validate `message_type` server-side when non-text types ship.

### Performance

1. Use keyset pagination (`created_at` cursor) — already supported in `MessageService.listMessages`.
2. For large groups, consider materialized unread counts per member (trigger-maintained).
3. Add partial index on `messages` for `message_type` when attachments ship (storage bucket linkage).

### Testing

1. Integration tests: group create → conversation exists → member added via invite → conversation_member row.
2. Test removed member loses SELECT on messages immediately.
3. Test DM dedup: two calls to `get_or_create_direct_conversation` return same ID.

---

## File Inventory

### Migrations

- `supabase/migrations/20260717120000_chat_domain_schema.sql`
- `supabase/migrations/20260717120001_chat_helpers_and_rpcs.sql`
- `supabase/migrations/20260717120002_chat_rls.sql`
- `supabase/migrations/20260717120003_chat_group_integration.sql`

### Frontend

- `frontend/src/features/chat/` — full feature module
- `frontend/src/types/database.types.ts` — chat tables, enums, RPCs

---

**Phase 1 complete.** Proceed to Phase 2: Premium Chat UI & UX.
