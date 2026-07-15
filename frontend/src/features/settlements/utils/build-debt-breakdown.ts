import { centsToDollars } from "@/features/balances/engine/rounding";
import type { ExpenseShareResult, SettlementInput } from "@/features/balances/engine/types";
import type { DebtBreakdown, DebtBreakdownLine } from "@/features/settlements/types";

export interface ExpenseBreakdownMeta {
  readonly title: string;
  readonly createdAt: string;
}

export interface SettlementBreakdownMeta {
  readonly notes?: string;
  readonly createdAt: string;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function resolveName(names: ReadonlyMap<string, string>, userId: string): string {
  return names.get(userId)?.trim() || "Someone";
}

interface BuildDebtBreakdownParams {
  readonly groupId: string;
  readonly fromUserId: string;
  readonly toUserId: string;
  readonly expenseResults: readonly ExpenseShareResult[];
  readonly settlements: readonly SettlementInput[];
  readonly expenseMeta: ReadonlyMap<string, ExpenseBreakdownMeta>;
  readonly settlementMeta: ReadonlyMap<string, SettlementBreakdownMeta>;
  readonly names: ReadonlyMap<string, string>;
  readonly formatMoney: (amount: number) => string;
}

/** Builds a line-by-line report for a bilateral debt in one group. */
export function buildDebtBreakdown(params: BuildDebtBreakdownParams): DebtBreakdown {
  const {
    groupId,
    fromUserId,
    toUserId,
    expenseResults,
    settlements,
    expenseMeta,
    settlementMeta,
    names,
    formatMoney,
  } = params;

  const fromName = resolveName(names, fromUserId);
  const toName = resolveName(names, toUserId);
  const lines: DebtBreakdownLine[] = [];

  for (const result of expenseResults) {
    if (result.groupId !== groupId) continue;

    const meta = expenseMeta.get(result.expenseId);
    const title = meta?.title?.trim() || "Untitled expense";
    const dateLabel = meta?.createdAt ? formatShortDate(meta.createdAt) : undefined;
    const sortKey = meta?.createdAt ?? "";

    const owed = result.relationships.find(
      (rel) => rel.fromUserId === fromUserId && rel.toUserId === toUserId,
    );
    if (owed && owed.amountCents > 0) {
      const amount = centsToDollars(owed.amountCents);
      lines.push({
        id: `expense-owed-${result.expenseId}`,
        type: "expense_owed",
        title,
        description: `${toName} paid · ${fromName}'s share`,
        amount,
        amountLabel: formatMoney(amount),
        dateLabel,
        sortKey,
      });
    }

    const credit = result.relationships.find(
      (rel) => rel.fromUserId === toUserId && rel.toUserId === fromUserId,
    );
    if (credit && credit.amountCents > 0) {
      const amount = centsToDollars(credit.amountCents);
      lines.push({
        id: `expense-credit-${result.expenseId}`,
        type: "expense_credit",
        title,
        description: `${fromName} paid · ${toName}'s share`,
        amount,
        amountLabel: formatMoney(amount),
        dateLabel,
        sortKey,
      });
    }
  }

  for (const settlement of settlements) {
    if (settlement.groupId !== groupId) continue;

    const meta = settlementMeta.get(settlement.id);
    const dateLabel = meta?.createdAt ? formatShortDate(meta.createdAt) : undefined;
    const sortKey = meta?.createdAt ?? "";
    const amount = centsToDollars(settlement.amountCents);

    if (settlement.fromUserId === fromUserId && settlement.toUserId === toUserId) {
      lines.push({
        id: `settlement-${settlement.id}`,
        type: "settlement",
        title: "Payment recorded",
        description: meta?.notes?.trim() || `${fromName} paid ${toName}`,
        amount,
        amountLabel: formatMoney(amount),
        dateLabel,
        sortKey,
      });
      continue;
    }

    if (settlement.fromUserId === toUserId && settlement.toUserId === fromUserId) {
      lines.push({
        id: `settlement-reverse-${settlement.id}`,
        type: "settlement_received",
        title: "Payment received",
        description: meta?.notes?.trim() || `${toName} paid ${fromName}`,
        amount,
        amountLabel: formatMoney(amount),
        dateLabel,
        sortKey,
      });
    }
  }

  lines.sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const expenseOwedTotal = lines
    .filter((line) => line.type === "expense_owed")
    .reduce((sum, line) => sum + line.amount, 0);
  const expenseCreditTotal = lines
    .filter((line) => line.type === "expense_credit")
    .reduce((sum, line) => sum + line.amount, 0);
  const settlementTotal = lines
    .filter((line) => line.type === "settlement")
    .reduce((sum, line) => sum + line.amount, 0);
  const settlementReceivedTotal = lines
    .filter((line) => line.type === "settlement_received")
    .reduce((sum, line) => sum + line.amount, 0);

  const calculatedNet =
    expenseOwedTotal - expenseCreditTotal - settlementTotal + settlementReceivedTotal;

  return {
    lines,
    expenseCount: lines.filter(
      (line) => line.type === "expense_owed" || line.type === "expense_credit",
    ).length,
    settlementCount: lines.filter(
      (line) => line.type === "settlement" || line.type === "settlement_received",
    ).length,
    calculatedNet,
    calculatedNetLabel: formatMoney(calculatedNet),
  };
}
