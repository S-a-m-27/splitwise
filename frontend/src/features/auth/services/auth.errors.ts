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
  | "oauth_cancelled"
  | "oauth_unavailable"
  | "oauth_failed"
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
  oauth_cancelled: "oauth_cancelled",
  oauth_unavailable: "oauth_unavailable",
  oauth_failed: "oauth_failed",
  access_denied: "oauth_cancelled",
};

const FRIENDLY_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials: "The email or password you entered is incorrect.",
  email_not_confirmed: "Please verify your email before signing in.",
  user_already_exists: "An account with this email already exists.",
  weak_password: "Password does not meet security requirements.",
  session_expired: "Your session has expired. Please sign in again.",
  network_error: "Network error. Check your connection and try again.",
  rate_limited: "Too many attempts. Please wait and try again.",
  oauth_cancelled: "Google sign-in was cancelled. You can try again anytime.",
  oauth_unavailable:
    "Google sign-in is temporarily unavailable. Please try again or use email.",
  oauth_failed: "We couldn't complete Google sign-in. Please try again.",
  unknown: "Something went wrong. Please try again.",
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
  const lowered = message.toLowerCase();

  if (lowered.includes("fetch") || lowered.includes("network")) {
    return {
      code: "network_error",
      message: FRIENDLY_MESSAGES.network_error,
      original: error,
    };
  }

  if (
    lowered.includes("popup") ||
    lowered.includes("closed") ||
    lowered.includes("access_denied") ||
    lowered.includes("cancelled") ||
    lowered.includes("canceled")
  ) {
    return {
      code: "oauth_cancelled",
      message: FRIENDLY_MESSAGES.oauth_cancelled,
      original: error,
    };
  }

  if (
    lowered.includes("provider is not enabled") ||
    lowered.includes("unsupported provider")
  ) {
    return {
      code: "oauth_unavailable",
      message: FRIENDLY_MESSAGES.oauth_unavailable,
      original: error,
    };
  }

  if (lowered.includes("oauth") || lowered.includes("provider")) {
    return {
      code: "oauth_failed",
      message: FRIENDLY_MESSAGES.oauth_failed,
      original: error,
    };
  }

  const code = ERROR_MESSAGE_MAP[message] ?? "unknown";

  return {
    code,
    message:
      code === "unknown" ? FRIENDLY_MESSAGES.unknown : FRIENDLY_MESSAGES[code],
    original: error,
  };
}

export function getAuthErrorMessage(
  error: AuthError | Error | null | undefined,
): string {
  return normalizeAuthError(error)?.message ?? FRIENDLY_MESSAGES.unknown;
}

/** Maps callback / query-string auth error codes to safe user-facing copy. */
export function getAuthQueryErrorMessage(
  errorParam: string | null | undefined,
): string {
  if (!errorParam) return FRIENDLY_MESSAGES.unknown;

  const normalized = errorParam.trim().toLowerCase();
  const mapped = ERROR_MESSAGE_MAP[errorParam] ?? ERROR_MESSAGE_MAP[normalized];
  if (mapped) return FRIENDLY_MESSAGES[mapped];

  if (
    normalized.includes("access_denied") ||
    normalized.includes("cancel") ||
    normalized.includes("denied")
  ) {
    return FRIENDLY_MESSAGES.oauth_cancelled;
  }

  if (normalized.includes("provider") || normalized.includes("oauth")) {
    return FRIENDLY_MESSAGES.oauth_unavailable;
  }

  return FRIENDLY_MESSAGES.oauth_failed;
}
