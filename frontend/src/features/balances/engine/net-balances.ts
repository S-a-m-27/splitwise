import { cents } from "@/features/balances/engine/rounding";
import type {
  Cents,
  DebtRelationship,
  ExpenseShareResult,
  UserBalance,
  UserId,
} from "@/features/balances/engine/types";

export type NetBalanceMap = ReadonlyMap<UserId, Cents>;

/** Creates a mutable net balance map (internal use only — callers receive immutable copies). */
export function createNetBalanceMap(): Map<UserId, Cents> {
  return new Map<UserId, Cents>();
}

/** Applies a single expense's shares to running net balances without mutating input. */
export function applyExpenseToNetBalances(
  current: NetBalanceMap,
  expenseResult: ExpenseShareResult,
): Map<UserId, Cents> {
  const next = new Map(current);

  for (const share of expenseResult.shares) {
    const existing = next.get(share.userId) ?? 0;
    next.set(share.userId, cents(existing - share.shareCents));
  }

  const payerBalance = next.get(expenseResult.paidBy) ?? 0;
  next.set(expenseResult.paidBy, cents(payerBalance + expenseResult.amountCents));

  return next;
}

/** Aggregates net balances from multiple expense results. */
export function calculateNetBalances(
  expenseResults: readonly ExpenseShareResult[],
): Map<UserId, Cents> {
  let balances = createNetBalanceMap();

  for (const result of expenseResults) {
    balances = applyExpenseToNetBalances(balances, result);
  }

  return balances;
}

/** Converts net cents map to UserBalance records. */
export function toUserBalances(netBalances: NetBalanceMap): ReadonlyMap<UserId, UserBalance> {
  const result = new Map<UserId, UserBalance>();

  for (const [userId, netCents] of netBalances) {
    result.set(userId, {
      userId,
      netCents,
      owedCents: netCents < 0 ? cents(Math.abs(netCents)) : 0,
      toReceiveCents: netCents > 0 ? netCents : 0,
    });
  }

  return result;
}

/** Merges bilateral relationships by summing amounts in the same direction and netting reverse flows. */
export function aggregateRelationships(
  relationships: readonly DebtRelationship[],
): readonly DebtRelationship[] {
  const pairMap = new Map<string, Cents>();

  for (const rel of relationships) {
    const forwardKey = `${rel.fromUserId}->${rel.toUserId}`;
    const reverseKey = `${rel.toUserId}->${rel.fromUserId}`;

    if (pairMap.has(reverseKey)) {
      const reverseAmount = pairMap.get(reverseKey)!;
      if (reverseAmount > rel.amountCents) {
        pairMap.set(reverseKey, cents(reverseAmount - rel.amountCents));
      } else if (reverseAmount < rel.amountCents) {
        pairMap.delete(reverseKey);
        pairMap.set(forwardKey, cents(rel.amountCents - reverseAmount));
      } else {
        pairMap.delete(reverseKey);
      }
    } else {
      pairMap.set(forwardKey, cents((pairMap.get(forwardKey) ?? 0) + rel.amountCents));
    }
  }

  const aggregated: DebtRelationship[] = [];
  for (const [key, amountCents] of pairMap) {
    if (amountCents <= 0) continue;
    const [fromUserId, toUserId] = key.split("->") as [UserId, UserId];
    aggregated.push({ fromUserId, toUserId, amountCents });
  }

  return aggregated;
}

export function calculateUserBalance(
  userId: UserId,
  netBalances: NetBalanceMap,
): UserBalance {
  const netCents = netBalances.get(userId) ?? 0;
  return {
    userId,
    netCents,
    owedCents: netCents < 0 ? cents(Math.abs(netCents)) : 0,
    toReceiveCents: netCents > 0 ? netCents : 0,
  };
}

export function mergeNetBalances(
  maps: readonly NetBalanceMap[],
): Map<UserId, Cents> {
  const merged = new Map<UserId, Cents>();

  for (const map of maps) {
    for (const [userId, netCents] of map) {
      merged.set(userId, cents((merged.get(userId) ?? 0) + netCents));
    }
  }

  return merged;
}

/** Drops zero balances for compact storage/display. */
export function normalizeBalances(netBalances: NetBalanceMap): Map<UserId, Cents> {
  const normalized = new Map<UserId, Cents>();
  for (const [userId, netCents] of netBalances) {
    if (netCents !== 0) {
      normalized.set(userId, netCents);
    }
  }
  return normalized;
}
