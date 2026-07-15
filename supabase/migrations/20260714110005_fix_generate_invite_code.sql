-- =============================================================================
-- Migration: fix_generate_invite_code
-- Purpose: Replace gen_random_bytes (requires pgcrypto) with gen_random_uuid().
-- Run this if create_group fails with "function gen_random_bytes does not exist".
-- =============================================================================

CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE sql
VOLATILE
AS $$
  SELECT substring(replace(gen_random_uuid()::text, '-', ''), 1, 12);
$$;

COMMENT ON FUNCTION public.generate_invite_code() IS
  'Returns a 12-character hex invite code using built-in gen_random_uuid().';
