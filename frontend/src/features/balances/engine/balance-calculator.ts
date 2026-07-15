import { calculateExpenseResult } from "@/features/balances/engine/expense-shares";
import { simplifyDebtsFromNetBalances } from "@/features/balances/engine/debt-simplification";
import {
  aggregateRelationships,
  calculateUserBalance,
  normalizeBalances,
  toUserBalances,
} from "@/features/balances/engine/net-balances";
import {
  applySettlementsToNetBalances,
  calculateGroupBalances,
  calculateNetBalances,
} from "@/features/balances/engine/settlement-calculator";
import type { SplitStrategyRegistry } from "@/features/balances/engine/split-strategy";
import { defaultSplitStrategyRegistry } from "@/features/balances/engine/expense-shares";
import type {
  BalanceEngineInput,
  BalanceEngineResult,
  DashboardSummary,
  ExpenseShareResult,
  GroupBalanceResult,
  GroupDashboardSummary,
  GroupId,
  SettlementInput,
  UserId,
  ValidatedExpense,
} from "@/features/balances/engine/types";
import { validateExpenses, validateSettlements } from "@/features/balances/engine/validators";

export function calculateDashboardSummary(
  currentUserId: UserId,
  groupBalances: ReadonlyMap<GroupId, GroupBalanceResult>,
): DashboardSummary {
  const groupSummaries: GroupDashboardSummary[] = [];

  let totalNet = 0;
  let totalOwe = 0;
  let totalOwed = 0;

  for (const group of groupBalances.values()) {
    const userBalance = group.userBalances.get(currentUserId) ?? {
      userId: currentUserId,
      netCents: 0,
      owedCents: 0,
      toReceiveCents: 0,
    };

    groupSummaries.push({
      groupId: group.groupId,
      netCents: userBalance.netCents,
      youOweCents: userBalance.owedCents,
      youAreOwedCents: userBalance.toReceiveCents,
    });

    totalNet += userBalance.netCents;
    totalOwe += userBalance.owedCents;
    totalOwed += userBalance.toReceiveCents;
  }

  return {
    currentUserId,
    netCents: totalNet,
    youOweCents: totalOwe,
    youAreOwedCents: totalOwed,
    groupSummaries,
  };
}

export function recalculateBalances(
  input: BalanceEngineInput,
  registry: SplitStrategyRegistry = defaultSplitStrategyRegistry,
): BalanceEngineResult {
  const validatedExpenses = validateExpenses(input.expenses);
  const validatedSettlements = validateSettlements(input.settlements);

  const expenseResults = validatedExpenses.map((expense) =>
    calculateExpenseResult(expense, registry),
  );

  return buildBalanceResult(expenseResults, validatedSettlements, input.currentUserId);
}

function buildBalanceResult(
  expenseResults: readonly ExpenseShareResult[],
  settlements: readonly SettlementInput[],
  currentUserId?: UserId,
): BalanceEngineResult {
  const groupIds = new Set<GroupId>();
  for (const result of expenseResults) {
    groupIds.add(result.groupId);
  }
  for (const settlement of settlements) {
    groupIds.add(settlement.groupId);
  }

  const groupBalances = new Map<GroupId, GroupBalanceResult>();
  for (const groupId of groupIds) {
    groupBalances.set(
      groupId,
      calculateGroupBalances(groupId, expenseResults, settlements),
    );
  }

  let overallNet = calculateNetBalances(expenseResults);
  overallNet = applySettlementsToNetBalances(overallNet, settlements);
  overallNet = normalizeBalances(overallNet);

  const overallRelationships = aggregateRelationships(
    expenseResults.flatMap((result) => result.relationships),
  );
  const simplifiedRelationships = simplifyDebtsFromNetBalances(overallNet);

  return {
    expenseResults,
    groupBalances,
    overallUserBalances: toUserBalances(overallNet),
    overallRelationships,
    simplifiedRelationships,
    ...(currentUserId ? { dashboard: calculateDashboardSummary(currentUserId, groupBalances) } : {}),
  };
}

export function calculateExpenseResults(
  expenses: readonly ValidatedExpense[],
  registry: SplitStrategyRegistry = defaultSplitStrategyRegistry,
): readonly ExpenseShareResult[] {
  return expenses.map((expense) => calculateExpenseResult(expense, registry));
}

export function calculateUserBalanceInGroup(
  userId: UserId,
  groupId: GroupId,
  input: BalanceEngineInput,
  registry: SplitStrategyRegistry = defaultSplitStrategyRegistry,
): ReturnType<typeof calculateUserBalance> {
  const result = recalculateBalances(input, registry);
  const group = result.groupBalances.get(groupId);
  if (!group) {
    return {
      userId,
      netCents: 0,
      owedCents: 0,
      toReceiveCents: 0,
    };
  }
  return (
    group.userBalances.get(userId) ?? {
      userId,
      netCents: 0,
      owedCents: 0,
      toReceiveCents: 0,
    }
  );
}
