import type {
  User as SupabaseUser,
  Session as SupabaseSession,
  AuthError,
} from "@supabase/supabase-js";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "../validation/auth.schema";
import { mapProfileRow, type UserProfile } from "../types";
import { getAuthErrorMessage } from "./auth.errors";
import { getAuthCallbackUrl } from "../utils/auth-callback";

export { getAuthErrorMessage };

/**
 * Browser-side authentication service.
 * All Supabase Auth calls go through this module — never call Supabase directly from UI.
 *
 * Profile rows are created by the database trigger (handle_new_user), not here.
 */
export const authService = {
  /** Registers a new user via Supabase Auth. Profile is auto-created by DB trigger. */
  async signUp({ email, password, fullName }: RegisterInput) {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: getAuthCallbackUrl("/dashboard"),
      },
    });

    return { data, error };
  },

  /** Signs in with email and password. */
  async signIn({ email, password }: LoginInput) {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  },

  /** Signs the user out and clears the local session. */
  async signOut() {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  /** Sends a password reset email via Supabase Auth. */
  async forgotPassword({ email }: ForgotPasswordInput) {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthCallbackUrl("/reset-password"),
    });

    return { error };
  },

  /** Updates the password for the currently authenticated user (after reset callback). */
  async resetPassword({ password }: ResetPasswordInput) {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.updateUser({ password });
    return { data, error };
  },

  /**
   * Returns the verified current user (JWT validated server-side by Supabase).
   * Prefer this over getSession() for auth decisions.
   */
  async getCurrentUser(): Promise<{
    user: SupabaseUser | null;
    session: SupabaseSession | null;
    error: AuthError | null;
  }> {
    const supabase = createBrowserClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { user: null, session: null, error: userError };
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    return { user, session, error: null };
  },

  /** Returns the current session (may be stale — use getCurrentUser for guards). */
  async getSession(): Promise<{
    session: SupabaseSession | null;
    error: AuthError | null;
  }> {
    const supabase = createBrowserClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    return { session, error };
  },

  /** Refreshes the current session using the refresh token. */
  async refreshSession(): Promise<{
    session: SupabaseSession | null;
    error: AuthError | null;
  }> {
    const supabase = createBrowserClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.refreshSession();

    return { session, error };
  },

  /** Fetches the user's profile from public.profiles (RLS-enforced). */
  async getProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, preferred_currency, created_at, updated_at")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapProfileRow(data);
  },

  /** Resends the email verification link. */
  async resendVerificationEmail(email: string) {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: getAuthCallbackUrl("/dashboard"),
      },
    });

    return { error };
  },

  getErrorMessage: getAuthErrorMessage,
};
