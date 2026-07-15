export type GroupsErrorCode =
  | "NO_SESSION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "ALREADY_MEMBER"
  | "INVALID_INVITE"
  | "EXPIRED_INVITE"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "SUPABASE_ERROR"
  | "UNKNOWN";

export interface NormalizedGroupsError {
  code: GroupsErrorCode;
  message: string;
}

const POSTGRES_MESSAGES: Record<string, GroupsErrorCode> = {
  "Not authenticated": "NO_SESSION",
  "Invite link is invalid or has expired": "INVALID_INVITE",
  "Invite link has expired": "EXPIRED_INVITE",
  "You are already a member of this group": "ALREADY_MEMBER",
  "This user is already a member of the group": "ALREADY_MEMBER",
  "A person with this name already exists in the group": "ALREADY_MEMBER",
  "A member with this name already exists in the group": "ALREADY_MEMBER",
  "Name is required": "VALIDATION_ERROR",
  "Only the group owner can regenerate invites": "FORBIDDEN",
  "Only the group owner can add members": "FORBIDDEN",
  "No registered account found with this email": "NOT_FOUND",
  "Please enter a valid email address": "VALIDATION_ERROR",
  "Email is required": "VALIDATION_ERROR",
  "Group name is required": "VALIDATION_ERROR",
  "Invalid invite code": "INVALID_INVITE",
};

export class GroupsServiceError extends Error {
  constructor(
    public readonly code: GroupsErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GroupsServiceError";
  }
}

function mapPostgresMessage(message: string): GroupsErrorCode | null {
  for (const [fragment, code] of Object.entries(POSTGRES_MESSAGES)) {
    if (message.includes(fragment)) return code;
  }
  return null;
}

export function normalizeGroupsError(error: unknown): NormalizedGroupsError {
  if (error instanceof GroupsServiceError) {
    return { code: error.code, message: error.message };
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    const mapped = mapPostgresMessage(message);

    if (mapped) {
      const useOriginal =
        message.includes("No registered") ||
        message.includes("valid email") ||
        message.includes("This user is already") ||
        message.includes("already exists in the group") ||
        message.includes("Email is required") ||
        message.includes("Name is required");
      return {
        code: mapped,
        message: useOriginal ? message : getDefaultMessage(mapped),
      };
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
      return { code: "NOT_FOUND", message: "Group not found or you do not have access." };
    }

    return { code: "SUPABASE_ERROR", message };
  }

  return {
    code: "UNKNOWN",
    message: "Something went wrong. Please try again.",
  };
}

function getDefaultMessage(code: GroupsErrorCode): string {
  switch (code) {
    case "NO_SESSION":
      return "Your session has expired. Please sign in again.";
    case "NOT_FOUND":
      return "Group not found or you do not have access.";
    case "FORBIDDEN":
      return "You do not have permission to perform this action.";
    case "ALREADY_MEMBER":
      return "You are already a member of this group.";
    case "INVALID_INVITE":
      return "This invite link is invalid or no longer active.";
    case "EXPIRED_INVITE":
      return "This invite link has expired.";
    case "VALIDATION_ERROR":
      return "Please check your input and try again.";
    case "NETWORK_ERROR":
      return "Unable to reach the server. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function getGroupsErrorMessage(error: unknown): string {
  return normalizeGroupsError(error).message;
}

export function isGroupsSessionError(error: unknown): boolean {
  return normalizeGroupsError(error).code === "NO_SESSION";
}
