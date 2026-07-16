import type { AuthError } from "@supabase/supabase-js";

/** Normalized auth error codes for consistent UI handling. */
export type AuthErrorCode =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "user_already_exists"
  | "weak_password"
  | "session_expired"
  | "network_error"
  | "rate_limited"
  | "unknown";

export interface NormalizedAuthError {
  code: AuthErrorCode;
  message: string;
  original?: AuthError | Error;
}

const ERROR_MESSAGE_MAP: Record<string, AuthErrorCode> = {
  "Invalid login credentials": "invalid_credentials",
  "Email not confirmed": "email_not_confirmed",
  "User already registered": "user_already_exists",
  "Password should be at least 6 characters": "weak_password",
  "New password should be different from the old password.": "weak_password",
  "Auth session missing!": "session_expired",
  "JWT expired": "session_expired",
  "Email rate limit exceeded": "rate_limited",
};

/**
 * Maps Supabase Auth errors to user-friendly, typed error objects.
 * Never exposes internal stack traces or service role details.
 */
export function normalizeAuthError(
  error: AuthError | Error | null | undefined,
): NormalizedAuthError | null {
  if (!error) return null;

  const message = error.message ?? "An unexpected error occurred";

  if (message.toLowerCase().includes("fetch")) {
    return {
      code: "network_error",
      message: "Network error. Check your connection and try again.",
      original: error,
    };
  }

  const code = ERROR_MESSAGE_MAP[message] ?? "unknown";

  const friendlyMessages: Record<AuthErrorCode, string> = {
    invalid_credentials: "The email or password you entered is incorrect.",
    email_not_confirmed: "Please verify your email before signing in.",
    user_already_exists: "An account with this email already exists.",
    weak_password: "Password does not meet security requirements.",
    session_expired: "Your session has expired. Please sign in again.",
    network_error: "Network error. Check your connection and try again.",
    rate_limited: "Too many attempts. Please wait and try again.",
    unknown: message,
  };

  return {
    code,
    message: friendlyMessages[code],
    original: error,
  };
}

export function getAuthErrorMessage(
  error: AuthError | Error | null | undefined,
): string {
  return normalizeAuthError(error)?.message ?? "An unexpected error occurred";
}
