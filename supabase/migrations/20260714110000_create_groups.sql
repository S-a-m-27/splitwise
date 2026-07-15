-- =============================================================================
-- Migration: create_groups
-- Purpose: Core groups table for expense-sharing groups.
-- =============================================================================

CREATE TYPE public.group_type AS ENUM ('trip', 'home', 'couple', 'friends', 'other');

CREATE TABLE public.groups (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  description TEXT,
  icon        TEXT        NOT NULL DEFAULT '🎉',
  type        public.group_type NOT NULL DEFAULT 'other',
  invite_code TEXT        NOT NULL UNIQUE,
  created_by  UUID        NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT groups_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT groups_icon_not_empty CHECK (char_length(trim(icon)) > 0)
);

COMMENT ON TABLE public.groups IS 'Expense-sharing groups. Members tracked in group_members.';
COMMENT ON COLUMN public.groups.invite_code IS 'Unique share-link code for inviting members.';

CREATE INDEX groups_created_by_idx ON public.groups (created_by);
CREATE INDEX groups_invite_code_idx ON public.groups (invite_code);
CREATE INDEX groups_updated_at_idx ON public.groups (updated_at DESC);

CREATE TRIGGER groups_set_updated_at
  BEFORE UPDATE ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
