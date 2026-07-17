import { env } from "@/lib/env";

/**
 * Builds the OAuth / email verification callback URL for Supabase Auth redirects.
 * Uses the current browser origin when available so local/preview hosts match
 * the tab the user started from (avoids Site URL dumping onto `/`).
 */
export function getAuthCallbackUrl(next?: string): string {
  const base =
    typeof window !== "undefined" ? window.location.origin : env.NEXT_PUBLIC_APP_URL;
  const url = new URL("/auth/callback", base);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}
