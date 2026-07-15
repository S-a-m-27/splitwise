import { describe, expect, it } from "vitest";
import { buildDebtBreakdown } from "@/features/settlements/utils/build-debt-breakdown";
import type { ExpenseShareResult, SettlementInput } from "@/features/balances/engine/types";

const names = new Map([
  ["user-a", "Ali"],
  ["user-b", "Sara"],
]);

const formatMoney = (amount: number) => `Rs ${amount.toFixed(2)}`;

describe("buildDebtBreakdown", () => {
  it("lists expense shares and settlements between two users", () => {
    const expenseResults: ExpenseShareResult[] = [
      {
        expenseId: "exp-1",
        groupId: "group-1",
        amountCents: 120_00,
        paidBy: "user-b",
        shares: [
          { userId: "user-a", shareCents: 40_00 },
          { userId: "user-b", shareCents: 40_00 },
        ],
        relationships: [{ fromUserId: "user-a", toUserId: "user-b", amountCents: 40_00 }],
      },
      {
        expenseId: "exp-2",
        groupId: "group-1",
        amountCents: 60_00,
        paidBy: "user-a",
        shares: [
          { userId: "user-a", shareCents: 30_00 },
          { userId: "user-b", shareCents: 30_00 },
        ],
        relationships: [{ fromUserId: "user-b", toUserId: "user-a", amountCents: 30_00 }],
      },
    ];

    const settlements: SettlementInput[] = [
      {
        id: "set-1",
        groupId: "group-1",
        fromUserId: "user-a",
        toUserId: "user-b",
        amountCents: 10_00,
      },
    ];

    const breakdown = buildDebtBreakdown({
      groupId: "group-1",
      fromUserId: "user-a",
      toUserId: "user-b",
      expenseResults,
      settlements,
      expenseMeta: new Map([
        ["exp-1", { title: "Dinner", createdAt: "2026-07-10T12:00:00.000Z" }],
        ["exp-2", { title: "Coffee", createdAt: "2026-07-11T12:00:00.000Z" }],
      ]),
      settlementMeta: new Map([
        ["set-1", { notes: "Bank transfer", createdAt: "2026-07-12T12:00:00.000Z" }],
      ]),
      names,
      formatMoney,
    });

    expect(breakdown.lines).toHaveLength(3);
    expect(breakdown.expenseCount).toBe(2);
    expect(breakdown.settlementCount).toBe(1);
    expect(breakdown.calculatedNet).toBe(0);
  });
});
