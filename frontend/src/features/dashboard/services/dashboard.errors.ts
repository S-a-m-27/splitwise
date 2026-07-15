export type DashboardErrorCode =
  | "NO_SESSION"
  | "PROFILE_NOT_FOUND"
  | "NETWORK_ERROR"
  | "SUPABASE_ERROR"
  | "UNKNOWN";

export interface NormalizedDashboardError {
  code: DashboardErrorCode;
  message: string;
}

export function normalizeDashboardError(error: unknown): NormalizedDashboardError {
  if (error instanceof DashboardServiceError) {
    return { code: error.code, message: error.message };
  }

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes("fetch")) {
      return {
        code: "NETWORK_ERROR",
        message: "Unable to reach the server. Check your connection and try again.",
      };
    }
    return { code: "UNKNOWN", message: error.message };
  }

  return {
    code: "UNKNOWN",
    message: "Something went wrong while loading your dashboard.",
  };
}

export class DashboardServiceError extends Error {
  constructor(
    public readonly code: DashboardErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DashboardServiceError";
  }
}

export function getDashboardErrorMessage(error: unknown): string {
  return normalizeDashboardError(error).message;
}

export function getDashboardErrorCode(error: unknown): DashboardErrorCode {
  return normalizeDashboardError(error).code;
}

export function isDashboardSessionError(error: unknown): boolean {
  return getDashboardErrorCode(error) === "NO_SESSION";
}
