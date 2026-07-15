-- =============================================================================
-- Migration: create_group_guests
-- Purpose: Name-only group participants who are not registered app users.
-- =============================================================================

CREATE TABLE public.group_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL CHECK (char_length(trim(display_name)) > 0),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX group_guests_group_name_unique
  ON public.group_guests (group_id, lower(trim(display_name)));

CREATE INDEX group_guests_group_id_idx
  ON public.group_guests (group_id);

ALTER TABLE public.group_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_guests_select_member"
  ON public.group_guests
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

-- Guest rows are inserted via add_group_guest_by_name (SECURITY DEFINER).

COMMENT ON TABLE public.group_guests IS
  'Name-only participants in a group who do not have registered accounts.';
