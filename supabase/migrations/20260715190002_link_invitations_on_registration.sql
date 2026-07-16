-- =============================================================================
-- Migration: link_invitations_on_registration
-- Purpose: Associate pending email invitations when a user registers.
--          Does NOT auto-accept or create group membership.
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

  PERFORM public.link_pending_invitations_to_user(NEW.id, NEW.email);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates a profiles row and links pending member invitations by email. Membership requires explicit acceptance.';
