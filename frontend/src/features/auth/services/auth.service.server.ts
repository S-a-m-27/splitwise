import { createClient as createServerClient } from "@/lib/supabase/server";
import { mapProfileRow, type UserProfile } from "@/features/auth/types";

/**
 * Server-side authentication helpers for Server Components, layouts, and route handlers.
 * Uses cookie-based session via @supabase/ssr — never import in Client Components.
 */
export const authServerService = {
  /** Returns the verified user from the server session (JWT validated by Supabase). */
  async getCurrentUser() {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    return { user: user ?? null, error };
  },

  /** Returns the server session (use getCurrentUser for auth guards). */
  async getSession() {
    const supabase = await createServerClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    return { session, error };
  },

  /** Fetches profile for the authenticated user (RLS-enforced). */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (error || !data) return null;
    return mapProfileRow(data);
  },

  /** Returns user + profile in a single call for server layouts. */
  async getAuthenticatedContext() {
    const { user, error } = await this.getCurrentUser();
    if (!user || error) {
      return { user: null, profile: null, error };
    }

    const profile = await this.getProfile(user.id);
    return { user, profile, error: null };
  },
};
