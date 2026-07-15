import { equalSplitStrategy } from "@/features/balances/engine/equal-split";
import {
  createSplitStrategyRegistry,
  resolveSplitStrategy,
  type SplitStrategyRegistry,
} from "@/features/balances/engine/split-strategy";
import type {
  DebtRelationship,
  ExpenseShareResult,
  ParticipantShare,
  ValidatedExpense,
} from "@/features/balances/engine/types";

const defaultRegistry = createSplitStrategyRegistry([equalSplitStrategy]);

export function calculateExpenseShares(
  expense: ValidatedExpense,
  registry: SplitStrategyRegistry = defaultRegistry,
): readonly ParticipantShare[] {
  const strategy = resolveSplitStrategy(registry, expense.splitType);
  return strategy.calculateShares(expense);
}

/** Bilateral debts from a single expense: each non-payer owes payer their share. */
export function calculateExpenseRelationships(
  expense: ValidatedExpense,
  shares: readonly ParticipantShare[],
): readonly DebtRelationship[] {
  const relationships: DebtRelationship[] = [];

  for (const share of shares) {
    if (share.userId === expense.paidBy) continue;

    relationships.push({
      fromUserId: share.userId,
      toUserId: expense.paidBy,
      amountCents: share.shareCents,
    });
  }

  return relationships;
}

export function calculateExpenseResult(
  expense: ValidatedExpense,
  registry: SplitStrategyRegistry = defaultRegistry,
): ExpenseShareResult {
  const shares = calculateExpenseShares(expense, registry);
  const relationships = calculateExpenseRelationships(expense, shares);

  return {
    expenseId: expense.id,
    groupId: expense.groupId,
    amountCents: expense.amountCents,
    paidBy: expense.paidBy,
    shares,
    relationships,
  };
}

export { defaultRegistry as defaultSplitStrategyRegistry };
