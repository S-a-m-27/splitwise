import { cents } from "@/features/balances/engine/rounding";
import { aggregateRelationships } from "@/features/balances/engine/net-balances";
import type { Cents, DebtRelationship, UserId } from "@/features/balances/engine/types";
import type { NetBalanceMap } from "@/features/balances/engine/net-balances";

interface BalanceEntry {
  userId: UserId;
  amountCents: Cents;
}

/**
 * Greedy min-cash-flow algorithm.
 * Produces at most (n - 1) transactions from net balances.
 * Positive net = creditor (to receive), negative net = debtor (owes).
 */
export function simplifyDebtsFromNetBalances(
  netBalances: NetBalanceMap,
): readonly DebtRelationship[] {
  const creditors: BalanceEntry[] = [];
  const debtors: BalanceEntry[] = [];

  for (const [userId, netCents] of netBalances) {
    if (netCents > 0) {
      creditors.push({ userId, amountCents: netCents });
    } else if (netCents < 0) {
      debtors.push({ userId, amountCents: cents(Math.abs(netCents)) });
    }
  }

  creditors.sort((a, b) => b.amountCents - a.amountCents);
  debtors.sort((a, b) => b.amountCents - a.amountCents);

  const relationships: DebtRelationship[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]!;
    const debtor = debtors[di]!;
    const transfer = cents(Math.min(creditor.amountCents, debtor.amountCents));

    if (transfer > 0) {
      relationships.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amountCents: transfer,
      });
    }

    creditor.amountCents = cents(creditor.amountCents - transfer);
    debtor.amountCents = cents(debtor.amountCents - transfer);

    if (creditor.amountCents === 0) ci += 1;
    if (debtor.amountCents === 0) di += 1;
  }

  return relationships;
}

/**
 * Simplifies chains in bilateral debt graph.
 * Example: A→B 10, B→C 10 becomes A→C 10
 */
export function simplifyDebtChains(
  relationships: readonly DebtRelationship[],
): readonly DebtRelationship[] {
  let debts: DebtRelationship[] = [...aggregateRelationships(relationships)];
  let changed = true;

  while (changed) {
    changed = false;
    const next: DebtRelationship[] = [...debts];

    for (let i = 0; i < debts.length; i += 1) {
      const inRel = debts[i]!;

      for (let j = 0; j < debts.length; j += 1) {
        if (i === j) continue;
        const outRel = debts[j]!;

        if (inRel.toUserId !== outRel.fromUserId) continue;
        if (inRel.fromUserId === outRel.toUserId) continue;

        const transfer = cents(Math.min(inRel.amountCents, outRel.amountCents));
        if (transfer <= 0) continue;

        next[i] = {
          ...inRel,
          amountCents: cents(inRel.amountCents - transfer),
        };
        next[j] = {
          ...outRel,
          amountCents: cents(outRel.amountCents - transfer),
        };

        const existing = next.find(
          (rel) =>
            rel.fromUserId === inRel.fromUserId && rel.toUserId === outRel.toUserId,
        );

        if (existing) {
          const index = next.findIndex(
            (rel) =>
              rel.fromUserId === inRel.fromUserId && rel.toUserId === outRel.toUserId,
          );
          if (index >= 0) {
            next[index] = {
              ...next[index]!,
              amountCents: cents(next[index]!.amountCents + transfer),
            };
          }
        } else {
          next.push({
            fromUserId: inRel.fromUserId,
            toUserId: outRel.toUserId,
            amountCents: transfer,
          });
        }

        changed = true;
      }
    }

    debts = aggregateRelationships(next).filter((rel) => rel.amountCents > 0);
  }

  return debts;
}

export function calculateRelationshipsFromNets(
  netBalances: NetBalanceMap,
): readonly DebtRelationship[] {
  return simplifyDebtsFromNetBalances(netBalances);
}
