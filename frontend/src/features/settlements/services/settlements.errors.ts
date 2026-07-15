export type SettlementsErrorCode =
  | "NO_SESSION"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNKNOWN";

export class SettlementsServiceError extends Error {
  readonly code: SettlementsErrorCode;

  constructor(code: SettlementsErrorCode, message: string) {
    super(message);
    this.name = "SettlementsServiceError";
    this.code = code;
  }
}

export function normalizeSettlementsError(error: {
  message: string;
  code?: string;
}): { code: SettlementsErrorCode; message: string } {
  const message = error.message;

  if (message.includes("Not authenticated")) {
    return {
      code: "NO_SESSION",
      message: "Your session has expired. Please sign in again.",
    };
  }

  if (
    message.includes("member or guest of the group") ||
    message.includes("must be a member of the group")
  ) {
    return {
      code: "VALIDATION_ERROR",
      message:
        "Both people must be in this group as a registered member or guest before recording payment.",
    };
  }

  return { code: "UNKNOWN", message };
}

export function getSettlementsErrorMessage(error: unknown): string {
  if (error instanceof SettlementsServiceError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong with settlements.";
}

export function isSettlementsSessionError(error: unknown): boolean {
  return error instanceof SettlementsServiceError && error.code === "NO_SESSION";
}
