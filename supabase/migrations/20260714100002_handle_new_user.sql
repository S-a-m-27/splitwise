-- =============================================================================
-- Migration: handle_new_user
-- Purpose: Automatically create a profile row when a user registers via Supabase Auth.
-- Runs as SECURITY DEFINER so it bypasses RLS without granting INSERT to clients.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_name TEXT;
BEGIN
  -- Accept full_name (preferred) or legacy name key from signUp metadata
  resolved_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    resolved_name,
    NULLIF(trim(NEW.raw_user_meta_data->>'avatar_url'), '')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates a profiles row after auth.users INSERT. Called by on_auth_user_created trigger.';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
