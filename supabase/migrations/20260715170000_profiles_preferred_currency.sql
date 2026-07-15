-- =============================================================================
-- Migration: profiles_preferred_currency
-- Purpose: Persist each user's app-wide display currency preference.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN preferred_currency TEXT NOT NULL DEFAULT 'PKR';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preferred_currency_valid
  CHECK (
    preferred_currency IN (
      'PKR', 'USD', 'EUR', 'GBP', 'INR', 'AED', 'SAR',
      'CAD', 'AUD', 'JPY', 'SGD', 'MYR', 'BDT', 'TRY', 'CNY'
    )
  );

COMMENT ON COLUMN public.profiles.preferred_currency IS
  'User-selected display currency for amounts across the app.';
