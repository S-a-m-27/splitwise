export type InvitationErrorCode =
  | "NO_SESSION"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INVITATION_ALREADY_EXISTS"
  | "ALREADY_MEMBER"
  | "INVITATION_EXPIRED"
  | "INVITATION_CANCELLED"
  | "INVITATION_DECLINED"
  | "UNAUTHORIZED_INVITATION_ACCESS"
  | "INVALID_INVITATION_STATE"
  | "FORBIDDEN"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface NormalizedInvitationError {
  readonly code: InvitationErrorCode;
  readonly message: string;
}

export class InvitationDomainError extends Error {
  readonly code: InvitationErrorCode;

  constructor(code: InvitationErrorCode, message: string) {
    super(message);
    this.name = "InvitationDomainError";
    this.code = code;
  }
}

export class InvitationServiceError extends Error {
  readonly code: InvitationErrorCode;

  constructor(code: InvitationErrorCode, message: string) {
    super(message);
    this.name = "InvitationServiceError";
    this.code = code;
  }
}

const POSTGRES_MESSAGES: Readonly<Record<string, InvitationErrorCode>> = {
  "Not authenticated": "NO_SESSION",
  "Please enter a valid email address": "VALIDATION_ERROR",
  "At least one delivery channel is required": "VALIDATION_ERROR",
  "share_link is not valid for member invitations": "VALIDATION_ERROR",
  "You cannot invite yourself": "VALIDATION_ERROR",
  "A pending invitation already exists for this email": "INVITATION_ALREADY_EXISTS",
  "A pending invitation already exists for this user": "INVITATION_ALREADY_EXISTS",
  "This user is already a member of the group": "ALREADY_MEMBER",
  "You are already a member of this group": "ALREADY_MEMBER",
  "Invitation not found": "NOT_FOUND",
  "Invitation is not pending": "INVALID_INVITATION_STATE",
  "Invitation has expired": "INVITATION_EXPIRED",
  "Only pending invitations can be cancelled": "INVALID_INVITATION_STATE",
  "Only pending invitations can be expired": "INVALID_INVITATION_STATE",
  "You are not authorized to accept this invitation": "UNAUTHORIZED_INVITATION_ACCESS",
  "You are not authorized to decline this invitation": "UNAUTHORIZED_INVITATION_ACCESS",
  "Only group owners or admins can send invitations": "FORBIDDEN",
  "Only group owners or admins can cancel invitations": "FORBIDDEN",
};

function mapPostgresMessage(message: string): InvitationErrorCode | null {
  for (const [fragment, code] of Object.entries(POSTGRES_MESSAGES)) {
    if (message.includes(fragment)) return code;
  }
  return null;
}

export function normalizeInvitationError(error: unknown): NormalizedInvitationError {
  if (error instanceof InvitationDomainError || error instanceof InvitationServiceError) {
    return { code: error.code, message: error.message };
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    const mapped = mapPostgresMessage(message);

    if (mapped) {
      return { code: mapped, message };
    }

    if (message.toLowerCase().includes("fetch")) {
      return {
        code: "NETWORK_ERROR",
        message: "Unable to reach the server. Check your connection and try again.",
      };
    }

    return { code: "UNKNOWN", message };
  }

  return {
    code: "UNKNOWN",
    message: "Something went wrong with invitations.",
  };
}

export function getInvitationErrorMessage(error: unknown): string {
  return normalizeInvitationError(error).message;
}

export function isInvitationSessionError(error: unknown): boolean {
  return normalizeInvitationError(error).code === "NO_SESSION";
}
