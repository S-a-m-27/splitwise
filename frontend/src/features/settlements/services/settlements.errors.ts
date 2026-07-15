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

export function getSettlementsErrorMessage(error: unknown): string {
  if (error instanceof SettlementsServiceError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong with settlements.";
}

export function isSettlementsSessionError(error: unknown): boolean {
  return error instanceof SettlementsServiceError && error.code === "NO_SESSION";
}
