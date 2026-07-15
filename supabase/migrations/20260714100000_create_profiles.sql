-- =============================================================================
-- Migration: create_profiles
-- Purpose: Application profile table linked to Supabase Auth users.
-- Auth credentials live in auth.users — this table stores app-specific data only.
-- =============================================================================

CREATE TABLE public.profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name  TEXT        NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT profiles_full_name_not_empty CHECK (char_length(trim(full_name)) > 0)
);

COMMENT ON TABLE public.profiles IS 'User profile data. One row per auth.users record.';
COMMENT ON COLUMN public.profiles.id IS 'References auth.users.id — never store passwords here.';

-- Index for chronological queries (admin dashboards, future features)
CREATE INDEX profiles_created_at_idx ON public.profiles (created_at DESC);
