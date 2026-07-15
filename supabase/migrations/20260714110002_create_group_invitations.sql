-- =============================================================================
-- Migration: create_group_invitations
-- Purpose: Share-link invitations — one active invite per group.
-- =============================================================================

CREATE TABLE public.group_invitations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID        NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  invite_code TEXT        NOT NULL UNIQUE,
  created_by  UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active      BOOLEAN     NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE public.group_invitations IS 'Active share-link invitations for groups.';

CREATE INDEX group_invitations_group_id_idx ON public.group_invitations (group_id);
CREATE INDEX group_invitations_invite_code_idx ON public.group_invitations (invite_code);

-- Only one active invitation per group
CREATE UNIQUE INDEX group_invitations_one_active_per_group
  ON public.group_invitations (group_id)
  WHERE active = TRUE;
