-- =============================================================================
-- Migration: google_auth_profile_ensure
-- Purpose: Harden Google OAuth profile initialization (idempotent, concurrency-safe).
-- - handle_new_user reads Google `picture` as well as `avatar_url`
-- - ensure_user_profile() fills missing profile / avatar without overwriting
--   user-customized full_name or existing avatar_url
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_name TEXT;
  resolved_avatar TEXT;
BEGIN
  resolved_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );

  -- Google OAuth commonly stores the photo under `picture`
  resolved_avatar := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'picture'), '')
  );

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    resolved_name,
    resolved_avatar
  )
  ON CONFLICT (id) DO NOTHING;

  PERFORM public.link_pending_invitations_to_user(NEW.id, NEW.email);

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Creates a profiles row after auth.users INSERT (email or OAuth). Idempotent. Links pending invitations by email.';

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT;
  v_meta JSONB;
  v_name TEXT;
  v_avatar TEXT;
  v_profile public.profiles;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT au.email, COALESCE(au.raw_user_meta_data, '{}'::JSONB)
  INTO v_email, v_meta
  FROM auth.users au
  WHERE au.id = v_user_id;

  IF NOT FOUND OR v_email IS NULL THEN
    RAISE EXCEPTION 'User not found' USING ERRCODE = '22023';
  END IF;

  v_name := COALESCE(
    NULLIF(trim(v_meta->>'full_name'), ''),
    NULLIF(trim(v_meta->>'name'), ''),
    split_part(v_email, '@', 1)
  );

  v_avatar := COALESCE(
    NULLIF(trim(v_meta->>'avatar_url'), ''),
    NULLIF(trim(v_meta->>'picture'), '')
  );

  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (v_user_id, v_name, v_avatar)
  ON CONFLICT (id) DO UPDATE
  SET
    avatar_url = CASE
      WHEN public.profiles.avatar_url IS NULL
        OR btrim(public.profiles.avatar_url) = ''
      THEN COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url)
      ELSE public.profiles.avatar_url
    END,
    updated_at = CASE
      WHEN (
        public.profiles.avatar_url IS NULL
        OR btrim(public.profiles.avatar_url) = ''
      )
      AND EXCLUDED.avatar_url IS NOT NULL
      AND EXCLUDED.avatar_url IS DISTINCT FROM public.profiles.avatar_url
      THEN NOW()
      ELSE public.profiles.updated_at
    END
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION public.ensure_user_profile() IS
  'Idempotent profile bootstrap for the current auth user. Creates missing rows and fills empty avatar_url from Google metadata without overwriting customized fields.';

REVOKE ALL ON FUNCTION public.ensure_user_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_user_profile() TO authenticated;
