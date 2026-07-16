-- =============================================================================
-- Migration: invitation_lifecycle_enum_values
-- Purpose: Extend notification_type enum (must commit before use in functions).
-- PostgreSQL does not allow new enum values in the same transaction they are added.
-- =============================================================================

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'invitation_accepted';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'invitation_declined';
