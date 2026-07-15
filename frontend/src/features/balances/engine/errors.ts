export type BalanceErrorCode =
  | "INVALID_AMOUNT"
  | "EMPTY_PARTICIPANTS"
  | "PAID_BY_NOT_PARTICIPANT"
  | "DUPLICATE_PARTICIPANTS"
  | "INVALID_EXPENSE"
  | "INVALID_SETTLEMENT"
  | "UNSUPPORTED_SPLIT_TYPE"
  | "SHARE_SUM_MISMATCH";

export class BalanceEngineError extends Error {
  constructor(
    public readonly code: BalanceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BalanceEngineError";
  }
}

export function assertBalanceEngine(
  condition: boolean,
  code: BalanceErrorCode,
  message: string,
): asserts condition {
  if (!condition) {
    throw new BalanceEngineError(code, message);
  }
}
