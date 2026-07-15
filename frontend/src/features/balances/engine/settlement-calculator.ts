import { cents } from "@/features/balances/engine/rounding";
import { simplifyDebtsFromNetBalances } from "@/features/balances/engine/debt-simplification";
import {
  aggregateRelationships,
  applyExpenseToNetBalances,
  calculateNetBalances,
  normalizeBalances,
  toUserBalances,
} from "@/features/balances/engine/net-balances";
import type {
  Cents,
  DebtRelationship,
  GroupBalanceResult,
  GroupId,
  SettlementInput,
  UserId,
} from "@/features/balances/engine/types";
import type { NetBalanceMap } from "@/features/balances/engine/net-balances";
import type { ExpenseShareResult } from "@/features/balances/engine/types";

export function applySettlementToNetBalances(
  current: NetBalanceMap,
  settlement: SettlementInput,
): Map<UserId, Cents> {
  const next = new Map(current);

  const fromBalance = next.get(settlement.fromUserId) ?? 0;
  const toBalance = next.get(settlement.toUserId) ?? 0;

  next.set(settlement.fromUserId, cents(fromBalance + settlement.amountCents));
  next.set(settlement.toUserId, cents(toBalance - settlement.amountCents));

  return next;
}

export function applySettlementsToNetBalances(
  current: NetBalanceMap,
  settlements: readonly SettlementInput[],
): Map<UserId, Cents> {
  let balances = new Map(current);
  for (const settlement of settlements) {
    balances = applySettlementToNetBalances(balances, settlement);
  }
  return balances;
}

export function applySettlementToRelationships(
  relationships: readonly DebtRelationship[],
  settlement: SettlementInput,
): readonly DebtRelationship[] {
  const aggregated = aggregateRelationships(relationships);
  const updated: DebtRelationship[] = [];

  let remaining = settlement.amountCents;
  let applied = false;

  for (const rel of aggregated) {
    if (
      rel.fromUserId === settlement.fromUserId &&
      rel.toUserId === settlement.toUserId
    ) {
      const newAmount = cents(rel.amountCents - remaining);
      remaining = 0;
      applied = true;
      if (newAmount > 0) {
        updated.push({
          fromUserId: rel.fromUserId,
          toUserId: rel.toUserId,
          amountCents: newAmount,
        });
      }
    } else {
      updated.push(rel);
    }
  }

  if (!applied && remaining > 0) {
    const reverse = aggregated.find(
      (rel) =>
        rel.fromUserId === settlement.toUserId &&
        rel.toUserId === settlement.fromUserId,
    );

    if (reverse) {
      const newReverse = cents(reverse.amountCents - remaining);
      for (const rel of updated) {
        if (
          rel.fromUserId === reverse.fromUserId &&
          rel.toUserId === reverse.toUserId
        ) {
          continue;
        }
      }
      const filtered = updated.filter(
        (rel) =>
          !(
            rel.fromUserId === reverse.fromUserId &&
            rel.toUserId === reverse.toUserId
          ),
      );
      if (newReverse > 0) {
        filtered.push({
          fromUserId: reverse.fromUserId,
          toUserId: reverse.toUserId,
          amountCents: newReverse,
        });
      } else if (newReverse < 0) {
        filtered.push({
          fromUserId: settlement.fromUserId,
          toUserId: settlement.toUserId,
          amountCents: cents(Math.abs(newReverse)),
        });
      }
      return filtered;
    }
  }

  return updated;
}

export function calculateSettlementImpact(
  relationships: readonly DebtRelationship[],
  settlement: SettlementInput,
): {
  updatedRelationships: readonly DebtRelationship[];
  simplifiedRelationships: readonly DebtRelationship[];
} {
  const updatedRelationships = applySettlementToRelationships(relationships, settlement);

  const netMap = relationshipsToNetBalances(updatedRelationships);
  const simplifiedRelationships = simplifyDebtsFromNetBalances(netMap);

  return { updatedRelationships, simplifiedRelationships };
}

/** Reconstructs net balances from simplified bilateral debts (for settlement preview). */
export function relationshipsToNetBalances(
  relationships: readonly DebtRelationship[],
): Map<UserId, Cents> {
  const balances = new Map<UserId, Cents>();

  for (const rel of relationships) {
    const fromBal = balances.get(rel.fromUserId) ?? 0;
    const toBal = balances.get(rel.toUserId) ?? 0;
    balances.set(rel.fromUserId, cents(fromBal - rel.amountCents));
    balances.set(rel.toUserId, cents(toBal + rel.amountCents));
  }

  return normalizeBalances(balances);
}

export function calculateGroupBalances(
  groupId: GroupId,
  expenseResults: readonly ExpenseShareResult[],
  settlements: readonly SettlementInput[] = [],
): GroupBalanceResult {
  const groupExpenses = expenseResults.filter((result) => result.groupId === groupId);
  const groupSettlements = settlements.filter((s) => s.groupId === groupId);

  let netBalances = calculateNetBalances(groupExpenses);
  netBalances = applySettlementsToNetBalances(netBalances, groupSettlements);

  const allRelationships = aggregateRelationships(
    groupExpenses.flatMap((result) => result.relationships),
  );

  const simplifiedRelationships = simplifyDebtsFromNetBalances(netBalances);

  const totalExpensesCents = cents(
    groupExpenses.reduce((sum, result) => sum + result.amountCents, 0),
  );

  return {
    groupId,
    userBalances: toUserBalances(netBalances),
    relationships: allRelationships,
    simplifiedRelationships,
    totalExpensesCents,
  };
}

export { applyExpenseToNetBalances, calculateNetBalances };
