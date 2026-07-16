import { describe, expect, it } from "vitest";
import { normalizeSettlementsError } from "@/features/settlements/services/settlements.errors";

describe("normalizeSettlementsError", () => {
  it.each([
    [
      "SettlementTooLarge: amount exceeds the remaining debt",
      "SETTLEMENT_TOO_LARGE",
    ],
    [
      "OutstandingDebtNotFound: payer does not owe receiver",
      "OUTSTANDING_DEBT_NOT_FOUND",
    ],
    [
      "SettlementConflict: idempotency key was reused with different details",
      "SETTLEMENT_CONFLICT",
    ],
    [
      "InvalidSettlementAmount: use a positive amount with at most two decimals",
      "INVALID_AMOUNT",
    ],
    [
      "SettlementNotAllowed: caller must be payer or receiver",
      "SETTLEMENT_NOT_ALLOWED",
    ],
    ["GroupNotFound: settlement group does not exist", "GROUP_NOT_FOUND"],
  ])("maps %s to %s", (message, expectedCode) => {
    expect(normalizeSettlementsError({ message }).code).toBe(expectedCode);
  });

  it("maps server authorization errors without exposing technical details", () => {
    const result = normalizeSettlementsError({
      message: "UnauthorizedSettlement: active group membership required",
      code: "42501",
    });

    expect(result).toEqual({
      code: "PERMISSION_DENIED",
      message: "You do not have permission to record this settlement.",
    });
  });
});
