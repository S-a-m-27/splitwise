-- =============================================================================
-- Migration: profiles_rls
-- Purpose: Row Level Security — users can only read/update their own profile.
-- Profile INSERT is handled exclusively by the handle_new_user trigger (SECURITY DEFINER).
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- No DELETE policy — profiles are removed via CASCADE when auth.users is deleted.
-- No INSERT policy for authenticated role — trigger handles creation securely.
