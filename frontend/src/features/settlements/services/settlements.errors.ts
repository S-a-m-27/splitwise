export type SettlementsErrorCode =
  | "NO_SESSION"
  | "VALIDATION_ERROR"
  | "PERMISSION_DENIED"
  | "NETWORK_ERROR"
  | "SETTLEMENT_NOT_ALLOWED"
  | "DEBT_ALREADY_SETTLED"
  | "SETTLEMENT_TOO_LARGE"
  | "INVALID_AMOUNT"
  | "SETTLEMENT_CONFLICT"
  | "GROUP_NOT_FOUND"
  | "OUTSTANDING_DEBT_NOT_FOUND"
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
  const domainCode = message.split(":", 1)[0] ?? "";

  const domainErrors: Partial<
    Record<SettlementsErrorCode | string, { code: SettlementsErrorCode; message: string }>
  > = {
    SettlementNotAllowed: {
      code: "SETTLEMENT_NOT_ALLOWED",
      message: "Only the payer or receiver can record this settlement.",
    },
    DebtAlreadySettled: {
      code: "DEBT_ALREADY_SETTLED",
      message: "This balance has already been settled. Refresh to see the latest balances.",
    },
    SettlementTooLarge: {
      code: "SETTLEMENT_TOO_LARGE",
      message: "The amount exceeds the remaining balance. Refresh and try again.",
    },
    InvalidSettlementAmount: {
      code: "INVALID_AMOUNT",
      message: "Enter a positive amount with no more than two decimal places.",
    },
    SettlementConflict: {
      code: "SETTLEMENT_CONFLICT",
      message: "This settlement request conflicts with an earlier attempt.",
    },
    GroupNotFound: {
      code: "GROUP_NOT_FOUND",
      message: "This group no longer exists.",
    },
    OutstandingDebtNotFound: {
      code: "OUTSTANDING_DEBT_NOT_FOUND",
      message: "No outstanding balance remains between these participants.",
    },
    InvalidSettlementRequest: {
      code: "VALIDATION_ERROR",
      message: "The settlement details are invalid.",
    },
  };
  const domainError = domainErrors[domainCode];
  if (domainError) return domainError;

  if (
    message.includes("Not authenticated") ||
    message.includes("UnauthorizedSettlement: authentication")
  ) {
    return {
      code: "NO_SESSION",
      message: "Your session has expired. Please sign in again.",
    };
  }

  if (
    error.code === "42501" ||
    message.toLowerCase().includes("permission denied") ||
    message.toLowerCase().includes("access denied") ||
    message.includes("UnauthorizedSettlement:")
  ) {
    return {
      code: "PERMISSION_DENIED",
      message: "You do not have permission to record this settlement.",
    };
  }

  if (
    message.toLowerCase().includes("failed to fetch") ||
    message.toLowerCase().includes("network") ||
    message.toLowerCase().includes("offline")
  ) {
    return {
      code: "NETWORK_ERROR",
      message: "Network unavailable. Check your connection and try again.",
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
