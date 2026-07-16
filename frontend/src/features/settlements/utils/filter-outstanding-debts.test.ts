import { describe, expect, it } from "vitest";
import type { OutstandingDebt } from "@/features/settlements/types";
import { filterOutstandingDebtsByGroup } from "@/features/settlements/utils/filter-outstanding-debts";

function debt(id: string, groupId: string): OutstandingDebt {
  return {
    id,
    groupId,
    groupName: "Trip",
    groupIcon: "✈️",
    fromUserId: "user-a",
    fromUserName: "Ali",
    toUserId: "user-b",
    toUserName: "Sara",
    amount: 10,
    amountLabel: "$10.00",
    direction: "you_owe",
    breakdown: {
      lines: [],
      expenseCount: 0,
      settlementCount: 0,
      calculatedNet: 10,
      calculatedNetLabel: "$10.00",
    },
  };
}

describe("filterOutstandingDebtsByGroup", () => {
  it("returns only debts for the selected group", () => {
    const result = filterOutstandingDebtsByGroup(
      [debt("a", "group-a"), debt("b", "group-b"), debt("c", "group-a")],
      "group-a",
    );

    expect(result.map((item) => item.id)).toEqual(["a", "c"]);
  });
});
