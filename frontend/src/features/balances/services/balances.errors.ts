export type BalancesErrorCode =
  | "NO_SESSION"
  | "UNKNOWN";

export class BalancesServiceError extends Error {
  readonly code: BalancesErrorCode;

  constructor(code: BalancesErrorCode, message: string) {
    super(message);
    this.name = "BalancesServiceError";
    this.code = code;
  }
}

export function getBalancesErrorMessage(error: unknown): string {
  if (error instanceof BalancesServiceError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong while calculating balances.";
}

export function isBalancesSessionError(error: unknown): boolean {
  return error instanceof BalancesServiceError && error.code === "NO_SESSION";
}
