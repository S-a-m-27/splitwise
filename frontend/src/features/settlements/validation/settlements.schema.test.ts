import { describe, expect, it } from "vitest";
import {
  createSettlementSchema,
  parseSettlementFormValues,
} from "@/features/settlements/validation/settlements.schema";

const groupId = "11111111-1111-4111-8111-111111111111";
const fromUserId = "22222222-2222-4222-8222-222222222222";
const toUserId = "33333333-3333-4333-8333-333333333333";

describe("settlement validation", () => {
  it("normalizes valid form values", () => {
    const result = parseSettlementFormValues({
      groupId,
      fromUserId,
      toUserId,
      amount: "25.50",
      notes: "  Bank transfer  ",
      maximumAmount: 50,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(25.5);
      expect(result.data.notes).toBe("Bank transfer");
    }
  });

  it("rejects an amount above the outstanding balance", () => {
    const result = parseSettlementFormValues({
      groupId,
      fromUserId,
      toUserId,
      amount: "50.01",
      notes: "",
      maximumAmount: 50,
    });

    expect(result.success).toBe(false);
  });

  it("rejects the same payer and recipient", () => {
    const result = createSettlementSchema.safeParse({
      groupId,
      fromUserId,
      toUserId: fromUserId,
      amount: 10,
      notes: "",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid client settlement retry key", () => {
    const result = createSettlementSchema.safeParse({
      groupId,
      fromUserId,
      toUserId,
      amount: 10,
      notes: "",
      clientSettlementId: "44444444-4444-4444-8444-444444444444",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a malformed client settlement retry key", () => {
    const result = createSettlementSchema.safeParse({
      groupId,
      fromUserId,
      toUserId,
      amount: 10,
      clientSettlementId: "retry-me",
    });

    expect(result.success).toBe(false);
  });
});
