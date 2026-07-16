-- =============================================================================
-- Migration: chat_domain_schema
-- Purpose: Unified conversation domain — group, direct, and future channel types.
-- Depends on: groups, group_members, profiles
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.conversation_type AS ENUM (
  'group',
  'direct',
  'announcement',
  'community'
);

COMMENT ON TYPE public.conversation_type IS
  'Unified conversation kinds. MVP uses group + direct; announcement/community reserved.';

CREATE TYPE public.conversation_member_role AS ENUM (
  'owner',
  'admin',
  'member',
  'moderator'
);

CREATE TYPE public.message_type AS ENUM (
  'text',
  'image',
  'video',
  'file',
  'voice',
  'location',
  'system'
);

COMMENT ON TYPE public.message_type IS
  'Message payload discriminator. MVP uses text only; others reserved for Phase 2+.';

CREATE TYPE public.chat_audit_event_type AS ENUM (
  'conversation_created',
  'conversation_archived',
  'member_joined',
  'member_left',
  'message_created',
  'message_updated',
  'message_deleted'
);

-- ---------------------------------------------------------------------------
-- Conversations
-- ---------------------------------------------------------------------------

CREATE TABLE public.conversations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                  public.conversation_type NOT NULL,
  group_id              UUID REFERENCES public.groups (id) ON DELETE SET NULL,
  created_by            UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  dm_pair_key           TEXT,
  last_message_at       TIMESTAMPTZ,
  last_message_preview  TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at            TIMESTAMPTZ,
  CONSTRAINT conversations_group_shape CHECK (
    (type = 'group' AND group_id IS NOT NULL AND dm_pair_key IS NULL)
    OR (type = 'direct' AND group_id IS NULL AND dm_pair_key IS NOT NULL)
    OR (type IN ('announcement', 'community') AND group_id IS NULL)
  ),
  CONSTRAINT conversations_last_preview_length CHECK (
    last_message_preview IS NULL OR char_length(last_message_preview) <= 280
  )
);

COMMENT ON TABLE public.conversations IS
  'Unified chat conversations. One group conversation per group; DMs keyed by dm_pair_key.';

COMMENT ON COLUMN public.conversations.dm_pair_key IS
  'Canonical sorted user-id pair for direct chats: min_uuid:max_uuid. Prevents duplicate DMs.';

COMMENT ON COLUMN public.conversations.deleted_at IS
  'Soft delete / archive timestamp. Group deletion archives rather than hard-deletes.';

-- Exactly one active group conversation per group
CREATE UNIQUE INDEX conversations_one_active_group
  ON public.conversations (group_id)
  WHERE type = 'group' AND group_id IS NOT NULL AND deleted_at IS NULL;

-- Prevent duplicate active direct conversations between the same two users
CREATE UNIQUE INDEX conversations_one_active_direct_pair
  ON public.conversations (dm_pair_key)
  WHERE type = 'direct' AND dm_pair_key IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX conversations_last_message_at_idx
  ON public.conversations (last_message_at DESC NULLS LAST)
  WHERE deleted_at IS NULL;

CREATE INDEX conversations_created_by_idx
  ON public.conversations (created_by);

CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Conversation members
-- ---------------------------------------------------------------------------

CREATE TABLE public.conversation_members (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id       UUID NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  user_id               UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role                  public.conversation_member_role NOT NULL DEFAULT 'member',
  joined_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_message_id  UUID,
  unread_count          INTEGER NOT NULL DEFAULT 0,
  muted_at              TIMESTAMPTZ,
  archived_at           TIMESTAMPTZ,
  left_at               TIMESTAMPTZ,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT conversation_members_unique_membership UNIQUE (conversation_id, user_id),
  CONSTRAINT conversation_members_unread_non_negative CHECK (unread_count >= 0)
);

COMMENT ON TABLE public.conversation_members IS
  'Per-user conversation membership, read state, and future mute/archive flags.';

COMMENT ON COLUMN public.conversation_members.unread_count IS
  'Denormalized unread counter — updated by message/read triggers in Phase 2.';

CREATE INDEX conversation_members_user_active_idx
  ON public.conversation_members (user_id, joined_at DESC)
  WHERE left_at IS NULL;

CREATE INDEX conversation_members_conversation_active_idx
  ON public.conversation_members (conversation_id)
  WHERE left_at IS NULL;

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------

CREATE TABLE public.messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  sender_id           UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  message_type        public.message_type NOT NULL DEFAULT 'text',
  content             TEXT,
  reply_to_message_id UUID REFERENCES public.messages (id) ON DELETE SET NULL,
  client_message_id   UUID,
  metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at           TIMESTAMPTZ,
  deleted_at          TIMESTAMPTZ,
  CONSTRAINT messages_content_length CHECK (
    content IS NULL OR char_length(content) <= 4000
  )
);

COMMENT ON TABLE public.messages IS
  'Chat messages. UUID PK supports offline client-generated IDs (client_message_id for dedup).';

COMMENT ON COLUMN public.messages.client_message_id IS
  'Optional client-supplied idempotency key for PWA offline sync (Phase 2).';

-- Idempotency: one client_message_id per sender per conversation
CREATE UNIQUE INDEX messages_client_idempotency_idx
  ON public.messages (conversation_id, sender_id, client_message_id)
  WHERE client_message_id IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX messages_conversation_created_idx
  ON public.messages (conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX messages_sender_idx
  ON public.messages (sender_id, created_at DESC);

-- Deferred FK: last_read_message_id → messages
ALTER TABLE public.conversation_members
  ADD CONSTRAINT conversation_members_last_read_message_id_fkey
  FOREIGN KEY (last_read_message_id) REFERENCES public.messages (id) ON DELETE SET NULL;

CREATE TRIGGER messages_set_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- Message reads (read receipts — Phase 2 writes)
-- ---------------------------------------------------------------------------

CREATE TABLE public.message_reads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  message_id       UUID NOT NULL REFERENCES public.messages (id) ON DELETE CASCADE,
  read_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT message_reads_unique_user_message UNIQUE (user_id, message_id)
);

COMMENT ON TABLE public.message_reads IS
  'Per-user read receipts. Populated in Phase 2; schema prepared in Phase 1.';

CREATE INDEX message_reads_conversation_user_idx
  ON public.message_reads (conversation_id, user_id, read_at DESC);

-- ---------------------------------------------------------------------------
-- Chat audit log (future moderation / compliance)
-- ---------------------------------------------------------------------------

CREATE TABLE public.chat_audit_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID REFERENCES public.conversations (id) ON DELETE SET NULL,
  actor_user_id    UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  event_type       public.chat_audit_event_type NOT NULL,
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.chat_audit_events IS
  'Append-only chat audit trail. Written by SECURITY DEFINER triggers/RPCs.';

CREATE INDEX chat_audit_events_conversation_idx
  ON public.chat_audit_events (conversation_id, created_at DESC);
