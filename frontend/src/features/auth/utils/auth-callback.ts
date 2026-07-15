import { env } from "@/lib/env";

/** Builds the OAuth / email verification callback URL for Supabase Auth redirects. */
export function getAuthCallbackUrl(next?: string): string {
  const base = env.NEXT_PUBLIC_APP_URL;
  const url = new URL("/auth/callback", base);
  if (next) url.searchParams.set("next", next);
  return url.toString();
}
