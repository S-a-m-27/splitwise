-- =============================================================================
-- Migration: create_group_members
-- Purpose: Membership junction between users and groups.
-- =============================================================================

CREATE TYPE public.group_member_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE public.group_members (
  id        UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID                   NOT NULL REFERENCES public.groups (id) ON DELETE CASCADE,
  user_id   UUID                   NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role      public.group_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ            NOT NULL DEFAULT NOW(),

  CONSTRAINT group_members_unique_membership UNIQUE (group_id, user_id)
);

COMMENT ON TABLE public.group_members IS 'Group membership. One row per user per group.';

CREATE INDEX group_members_group_id_idx ON public.group_members (group_id);
CREATE INDEX group_members_user_id_idx ON public.group_members (user_id);
