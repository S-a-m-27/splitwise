import { describe, expect, it } from "vitest";
import {
  BalanceEngine,
  BalanceEngineError,
  calculateEqualSplit,
  calculateSettlementImpact,
  centsToDollars,
  distributeCentsEvenly,
  dollarsToCents,
  recalculateBalances,
  simplifyDebtChains,
  simplifyDebtsFromNetBalances,
  sumCents,
  validateExpenseInput,
} from "@/features/balances/engine";

const GROUP = "group-1";

function expense(
  id: string,
  amountDollars: number,
  paidBy: string,
  participants: string[],
) {
  return {
    id,
    groupId: GROUP,
    amountCents: dollarsToCents(amountDollars),
    paidBy,
    participantIds: participants,
    splitType: "equal" as const,
  };
}

describe("rounding", () => {
  it("distributes 10/3 deterministically with no money lost", () => {
    const shares = distributeCentsEvenly(1000, 3);
    expect(shares).toEqual([334, 333, 333]);
    expect(sumCents(shares)).toBe(1000);
  });

  it("handles odd amounts across 10 participants", () => {
    const shares = distributeCentsEvenly(10001, 10);
    expect(sumCents(shares)).toBe(10001);
    expect(shares.every((s) => s === 1000 || s === 1001)).toBe(true);
  });

  it("handles very large amounts", () => {
    const shares = distributeCentsEvenly(999_999_999, 7);
    expect(sumCents(shares)).toBe(999_999_999);
  });
});

describe("equal split", () => {
  it("splits dinner example equally among 3", () => {
    const shares = calculateEqualSplit(dollarsToCents(120), ["ali", "ahmed", "sara"]);
    expect(shares.map((s) => s.shareCents)).toEqual([
      dollarsToCents(40),
      dollarsToCents(40),
      dollarsToCents(40),
    ]);
  });

  it("supports 2 participants", () => {
    const shares = calculateEqualSplit(dollarsToCents(50), ["a", "b"]);
    expect(sumCents(shares.map((s) => s.shareCents))).toBe(dollarsToCents(50));
  });
});

describe("single expense — dinner example", () => {
  it("calculates net balances and relationships", () => {
    const result = recalculateBalances({
      expenses: [expense("e1", 120, "ali", ["ali", "ahmed", "sara"])],
    });

    const ali = result.overallUserBalances.get("ali")!;
    const ahmed = result.overallUserBalances.get("ahmed")!;
    const sara = result.overallUserBalances.get("sara")!;

    expect(centsToDollars(ali.netCents)).toBe(80);
    expect(centsToDollars(ahmed.netCents)).toBe(-40);
    expect(centsToDollars(sara.netCents)).toBe(-40);

    expect(result.simplifiedRelationships).toEqual([
      { fromUserId: "ahmed", toUserId: "ali", amountCents: dollarsToCents(40) },
      { fromUserId: "sara", toUserId: "ali", amountCents: dollarsToCents(40) },
    ]);
  });
});

describe("multiple expenses aggregation", () => {
  it("aggregates three expenses like Splitwise", () => {
    const result = recalculateBalances({
      expenses: [
        expense("e1", 120, "ali", ["ali", "ahmed", "sara"]),
        expense("e2", 60, "ahmed", ["ali", "ahmed"]),
        expense("e3", 90, "sara", ["ahmed", "sara"]),
      ],
    });

    expect(centsToDollars(result.overallUserBalances.get("ali")!.netCents)).toBe(50);
    expect(centsToDollars(result.overallUserBalances.get("ahmed")!.netCents)).toBe(-55);
    expect(centsToDollars(result.overallUserBalances.get("sara")!.netCents)).toBe(5);

    const simplified = result.simplifiedRelationships;
    const ahmedOwesAli = simplified.find(
      (r) => r.fromUserId === "ahmed" && r.toUserId === "ali",
    );
    const ahmedOwesSara = simplified.find(
      (r) => r.fromUserId === "ahmed" && r.toUserId === "sara",
    );

    expect(centsToDollars(ahmedOwesAli?.amountCents ?? 0)).toBe(50);
    expect(centsToDollars(ahmedOwesSara?.amountCents ?? 0)).toBe(5);
  });
});

describe("dashboard summary", () => {
  it("calculates per-user dashboard totals", () => {
    const result = recalculateBalances({
      expenses: [
        expense("e1", 120, "ali", ["ali", "ahmed", "sara"]),
        expense("e2", 60, "ahmed", ["ali", "ahmed"]),
        expense("e3", 90, "sara", ["ahmed", "sara"]),
      ],
      currentUserId: "ahmed",
    });

    expect(result.dashboard).toBeDefined();
    expect(centsToDollars(result.dashboard!.netCents)).toBe(-55);
    expect(centsToDollars(result.dashboard!.youOweCents)).toBe(55);
    expect(centsToDollars(result.dashboard!.youAreOwedCents)).toBe(0);
  });
});

describe("group balances", () => {
  it("calculates per-group balances", () => {
    const result = recalculateBalances({
      expenses: [
        expense("e1", 100, "a", ["a", "b"]),
        { ...expense("e2", 40, "b", ["b", "c"]), groupId: "group-2" },
      ],
    });

    const group1 = result.groupBalances.get(GROUP)!;
    const group2 = result.groupBalances.get("group-2")!;

    expect(centsToDollars(group1.userBalances.get("a")!.netCents)).toBe(50);
    expect(centsToDollars(group1.userBalances.get("b")!.netCents)).toBe(-50);
    expect(centsToDollars(group2.userBalances.get("b")!.netCents)).toBe(20);
    expect(centsToDollars(group2.userBalances.get("c")!.netCents)).toBe(-20);
  });
});

describe("settlements", () => {
  it("applies settlement and updates balances", () => {
    const base = recalculateBalances({
      expenses: [expense("e1", 100, "ali", ["ali", "ahmed"])],
    });

    const withSettlement = recalculateBalances({
      expenses: [expense("e1", 100, "ali", ["ali", "ahmed"])],
      settlements: [
        {
          id: "s1",
          groupId: GROUP,
          fromUserId: "ahmed",
          toUserId: "ali",
          amountCents: dollarsToCents(50),
        },
      ],
    });

    expect(centsToDollars(base.overallUserBalances.get("ahmed")!.netCents)).toBe(-50);
    expect(centsToDollars(withSettlement.overallUserBalances.get("ahmed")?.netCents ?? 0)).toBe(0);
    expect(centsToDollars(withSettlement.overallUserBalances.get("ali")?.netCents ?? 0)).toBe(0);
  });

  it("previews settlement impact on relationships", () => {
    const base = recalculateBalances({
      expenses: [expense("e1", 100, "ali", ["ali", "ahmed"])],
    });

    const impact = calculateSettlementImpact(base.overallRelationships, {
      id: "s1",
      groupId: GROUP,
      fromUserId: "ahmed",
      toUserId: "ali",
      amountCents: dollarsToCents(50),
    });

    expect(impact.updatedRelationships).toHaveLength(0);
    expect(impact.simplifiedRelationships).toHaveLength(0);
  });
});

describe("debt simplification", () => {
  it("simplifies chain debts A→B, B→C into A→C", () => {
    const simplified = simplifyDebtChains([
      { fromUserId: "ali", toUserId: "ahmed", amountCents: dollarsToCents(10) },
      { fromUserId: "ahmed", toUserId: "sara", amountCents: dollarsToCents(10) },
    ]);

    expect(simplified).toEqual([
      { fromUserId: "ali", toUserId: "sara", amountCents: dollarsToCents(10) },
    ]);
  });

  it("greedy net simplification minimizes transactions", () => {
    const nets = new Map([
      ["ali", dollarsToCents(80)],
      ["ahmed", dollarsToCents(-40)],
      ["sara", dollarsToCents(-40)],
    ]);

    const simplified = simplifyDebtsFromNetBalances(nets);
    expect(simplified).toHaveLength(2);
    expect(sumCents(simplified.map((r) => r.amountCents))).toBe(dollarsToCents(80));
  });
});

describe("validation", () => {
  it("rejects zero amount", () => {
    expect(() =>
      validateExpenseInput({
        id: "e1",
        groupId: GROUP,
        amountCents: 0,
        paidBy: "ali",
        participantIds: ["ali"],
        splitType: "equal",
      }),
    ).toThrow(BalanceEngineError);
  });

  it("rejects empty participants", () => {
    expect(() =>
      validateExpenseInput({
        id: "e1",
        groupId: GROUP,
        amountCents: 100,
        paidBy: "ali",
        participantIds: [],
        splitType: "equal",
      }),
    ).toThrow(BalanceEngineError);
  });

  it("rejects payer not in participants", () => {
    expect(() =>
      validateExpenseInput({
        id: "e1",
        groupId: GROUP,
        amountCents: 100,
        paidBy: "ali",
        participantIds: ["ahmed"],
        splitType: "equal",
      }),
    ).toThrow(BalanceEngineError);
  });

  it("rejects duplicate participants", () => {
    expect(() =>
      validateExpenseInput({
        id: "e1",
        groupId: GROUP,
        amountCents: 100,
        paidBy: "ali",
        participantIds: ["ali", "ali"],
        splitType: "equal",
      }),
    ).toThrow(BalanceEngineError);
  });

  it("rejects unsupported split types in MVP", () => {
    expect(() =>
      validateExpenseInput({
        id: "e1",
        groupId: GROUP,
        amountCents: 100,
        paidBy: "ali",
        participantIds: ["ali", "ahmed"],
        splitType: "percentage",
      }),
    ).toThrow(BalanceEngineError);
  });
});

describe("immutability", () => {
  it("does not mutate input expenses", () => {
    const expenses = [expense("e1", 90, "a", ["a", "b", "c"])];
    const snapshot = JSON.stringify(expenses);
    recalculateBalances({ expenses });
    expect(JSON.stringify(expenses)).toBe(snapshot);
  });
});

describe("BalanceEngine facade", () => {
  it("exposes recalculate through facade", () => {
    const result = BalanceEngine.recalculate({
      expenses: [expense("e1", 30, "x", ["x", "y", "z"])],
    });
    expect(result.expenseResults).toHaveLength(1);
    expect(sumCents(result.expenseResults[0]!.shares.map((s) => s.shareCents))).toBe(
      dollarsToCents(30),
    );
  });
});

describe("repeated expenses", () => {
  it("handles many repeated identical expenses", () => {
    const expenses = Array.from({ length: 50 }, (_, i) =>
      expense(`e${i}`, 10, "a", ["a", "b"]),
    );

    const result = recalculateBalances({ expenses });
    expect(centsToDollars(result.overallUserBalances.get("a")!.netCents)).toBe(250);
    expect(centsToDollars(result.overallUserBalances.get("b")!.netCents)).toBe(-250);
  });
});

describe("decimal amounts", () => {
  it("handles cents-level decimal inputs", () => {
    const result = recalculateBalances({
      expenses: [expense("e1", 10.01, "a", ["a", "b", "c"])],
    });

    expect(sumCents(result.expenseResults[0]!.shares.map((s) => s.shareCents))).toBe(1001);
  });
});
