export type ProfileErrorCode =
  | "NO_SESSION"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INVALID_PASSWORD"
  | "NETWORK_ERROR"
  | "SUPABASE_ERROR"
  | "UNKNOWN";

export interface NormalizedProfileError {
  code: ProfileErrorCode;
  message: string;
}

const POSTGRES_MESSAGES: Record<string, ProfileErrorCode> = {
  "Not authenticated": "NO_SESSION",
};

export class ProfileServiceError extends Error {
  constructor(
    public readonly code: ProfileErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProfileServiceError";
  }
}

function mapPostgresMessage(message: string): ProfileErrorCode | null {
  for (const [fragment, code] of Object.entries(POSTGRES_MESSAGES)) {
    if (message.includes(fragment)) return code;
  }
  return null;
}

export function normalizeProfileError(error: unknown): NormalizedProfileError {
  if (error instanceof ProfileServiceError) {
    return { code: error.code, message: error.message };
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    const mapped = mapPostgresMessage(message);

    if (mapped) {
      return { code: mapped, message: getDefaultMessage(mapped) };
    }

    if (message.toLowerCase().includes("fetch")) {
      return {
        code: "NETWORK_ERROR",
        message: "Unable to reach the server. Check your connection and try again.",
      };
    }

    if (
      message.includes("PGRST116") ||
      message.toLowerCase().includes("not found") ||
      message.includes("0 rows")
    ) {
      return { code: "NOT_FOUND", message: "Profile not found." };
    }

    return { code: "SUPABASE_ERROR", message };
  }

  return {
    code: "UNKNOWN",
    message: "Something went wrong. Please try again.",
  };
}

function getDefaultMessage(code: ProfileErrorCode): string {
  switch (code) {
    case "NO_SESSION":
      return "Your session has expired. Please sign in again.";
    case "NOT_FOUND":
      return "Profile not found.";
    case "VALIDATION_ERROR":
      return "Please check your input and try again.";
    case "INVALID_PASSWORD":
      return "Current password is incorrect.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function getProfileErrorMessage(error: unknown): string {
  return normalizeProfileError(error).message;
}

export function isProfileSessionError(error: unknown): boolean {
  return normalizeProfileError(error).code === "NO_SESSION";
}
