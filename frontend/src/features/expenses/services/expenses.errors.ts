export type ExpensesErrorCode =
  | "NO_SESSION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "SUPABASE_ERROR"
  | "UNKNOWN";

export interface NormalizedExpensesError {
  code: ExpensesErrorCode;
  message: string;
}

const POSTGRES_MESSAGES: Record<string, ExpensesErrorCode> = {
  "Not authenticated": "NO_SESSION",
  "Expense not found": "NOT_FOUND",
  "You do not have access to this group": "FORBIDDEN",
  "You do not have access to this expense": "FORBIDDEN",
  "Expense title is required": "VALIDATION_ERROR",
  "Amount must be greater than zero": "VALIDATION_ERROR",
  "At least one participant is required": "VALIDATION_ERROR",
  "Payer must be a member of the group": "VALIDATION_ERROR",
  "All participants must be members of the group": "VALIDATION_ERROR",
};

export class ExpensesServiceError extends Error {
  constructor(
    public readonly code: ExpensesErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ExpensesServiceError";
  }
}

function mapPostgresMessage(message: string): ExpensesErrorCode | null {
  for (const [fragment, code] of Object.entries(POSTGRES_MESSAGES)) {
    if (message.includes(fragment)) return code;
  }
  return null;
}

export function normalizeExpensesError(error: unknown): NormalizedExpensesError {
  if (error instanceof ExpensesServiceError) {
    return { code: error.code, message: error.message };
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    const mapped = mapPostgresMessage(message);

    if (mapped) {
      const useOriginal =
        mapped === "VALIDATION_ERROR" ||
        message.includes("participants") ||
        message.includes("Payer");
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
      return { code: "NOT_FOUND", message: "Expense not found or you do not have access." };
    }

    return { code: "SUPABASE_ERROR", message };
  }

  return {
    code: "UNKNOWN",
    message: "Something went wrong. Please try again.",
  };
}

function getDefaultMessage(code: ExpensesErrorCode): string {
  switch (code) {
    case "NO_SESSION":
      return "Your session has expired. Please sign in again.";
    case "NOT_FOUND":
      return "Expense not found or you do not have access.";
    case "FORBIDDEN":
      return "You do not have permission to perform this action.";
    case "VALIDATION_ERROR":
      return "Please check your input and try again.";
    case "NETWORK_ERROR":
      return "Unable to reach the server. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function getExpensesErrorMessage(error: unknown): string {
  return normalizeExpensesError(error).message;
}

export function isExpensesSessionError(error: unknown): boolean {
  return normalizeExpensesError(error).code === "NO_SESSION";
}
