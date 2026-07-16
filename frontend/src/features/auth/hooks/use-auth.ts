"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { resolvePostLoginRedirect } from "@/lib/post-login-redirect";
import { getSafeRedirect } from "@/lib/safe-redirect";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/env";
import { useAuthStore } from "../store/auth-store";
import { authService } from "../services/auth.service";
import type { LoginInput, RegisterInput } from "../validation/auth.schema";

function getMutationErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

async function syncAuthState() {
  const { setAuth, clearAuth } = useAuthStore.getState();
  const { user, session } = await authService.getCurrentUser();

  if (session && user) {
    const profile = await authService.getProfile(user.id);
    setAuth(session, user, profile);
    return;
  }

  clearAuth();
}

/**
 * Initializes authentication state and listens for Supabase session changes.
 */
export function useInitializeAuth() {
  const { setInitialized } = useAuthStore();

  useEffect(() => {
    let active = true;

    async function initSession() {
      try {
        if (active) {
          await syncAuthState();
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
        if (active) {
          useAuthStore.getState().clearAuth();
        }
      } finally {
        if (active) {
          setInitialized(true);
        }
      }
    }

    void initSession();

    if (!hasSupabaseEnv()) {
      return;
    }

    const supabase = createBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      if (!active) return;
      await syncAuthState();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [setInitialized]);
}

/** Access user details and auth action mutations. */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, profile, session, isLoading, initialized } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: ({
      credentials,
    }: {
      credentials: LoginInput;
      redirectTo?: string | null;
    }) => authService.signIn(credentials),
    onSuccess: async (result, variables) => {
      if (result.error) {
        toast.error(authService.getErrorMessage(result.error));
        return;
      }

      await syncAuthState();
      toast.success("Welcome back!");
      queryClient.clear();
      const target = await resolvePostLoginRedirect(variables.redirectTo);
      router.replace(target);
    },
    onError: (error: unknown) => {
      toast.error(getMutationErrorMessage(error));
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({
      fields,
    }: {
      fields: RegisterInput;
      redirectTo?: string | null;
    }) => authService.signUp(fields),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(authService.getErrorMessage(result.error));
        return;
      }

      toast.success("Account created! Please check your email to confirm registration.");

      const params = new URLSearchParams();
      if (variables.fields.email) {
        params.set("email", variables.fields.email);
      }

      const safeRedirect = getSafeRedirect(variables.redirectTo);
      if (safeRedirect) {
        params.set("redirect", safeRedirect);
      }

      const query = params.toString();
      router.push(query ? `${ROUTES.login}?${query}` : ROUTES.login);
    },
    onError: (error: unknown) => {
      toast.error(getMutationErrorMessage(error));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(authService.getErrorMessage(result.error));
        return;
      }

      useAuthStore.getState().clearAuth();
      toast.success("Signed out successfully");
      queryClient.clear();
      router.push(ROUTES.home);
    },
    onError: () => {
      toast.error("Failed to sign out");
    },
  });

  return {
    user,
    profile,
    session,
    isAuthenticated: !!session,
    isLoading: isLoading || !initialized,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
