import type { SplitType } from "@/features/expenses/types";
import { formatExpenseAmount } from "@/features/expenses/utils/format-expense-amount";

export interface SplitPreviewLine {
  participantId: string;
  displayAmount: number;
  inputValue: string;
}

export interface SplitPreviewResult {
  lines: SplitPreviewLine[];
  summaryLabel: string;
  remainingLabel?: string;
  isValid: boolean;
}

function parsePositive(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

export function buildSplitPreview(params: {
  amount: number;
  participantIds: string[];
  splitType: SplitType;
  splitValues: Record<string, string>;
  payerName: string;
  payerIsCurrentUser: boolean;
}): SplitPreviewResult {
  const { amount, participantIds, splitType, splitValues, payerName, payerIsCurrentUser } = params;
  const count = participantIds.length;

  if (count === 0 || amount <= 0) {
    return { lines: [], summaryLabel: "Add participants to preview the split", isValid: false };
  }

  if (splitType === "equal") {
    const each = amount / count;
    const lines = participantIds.map((id) => ({
      participantId: id,
      displayAmount: each,
      inputValue: each.toFixed(2),
    }));

    const othersOwe = payerIsCurrentUser
      ? `others owe ${formatExpenseAmount(each)} each`
      : `you owe ${formatExpenseAmount(each)}`;

    return {
      lines,
      summaryLabel: payerIsCurrentUser
        ? `You paid — ${count > 1 ? othersOwe : "no split needed"}`
        : `${payerName} paid — ${othersOwe}`,
      isValid: true,
    };
  }

  if (splitType === "exact") {
    let assigned = 0;
    const lines = participantIds.map((id) => {
      const inputValue = splitValues[id] ?? "";
      const value = parsePositive(inputValue);
      assigned += value;
      return { participantId: id, displayAmount: value, inputValue };
    });

    const remaining = amount - assigned;
    const isValid = Math.abs(remaining) < 0.01;

    return {
      lines,
      summaryLabel: isValid
        ? "Exact amounts add up correctly"
        : remaining > 0
          ? `${formatExpenseAmount(remaining)} left to assign`
          : `${formatExpenseAmount(Math.abs(remaining))} over-assigned`,
      remainingLabel: isValid ? undefined : formatExpenseAmount(Math.abs(remaining)),
      isValid,
    };
  }

  if (splitType === "percentage") {
    let totalPercent = 0;
    const lines = participantIds.map((id) => {
      const inputValue = splitValues[id] ?? "";
      const percent = parsePositive(inputValue);
      totalPercent += percent;
      return {
        participantId: id,
        displayAmount: (amount * percent) / 100,
        inputValue,
      };
    });

    const remaining = 100 - totalPercent;
    const isValid = Math.abs(remaining) < 0.01;

    return {
      lines,
      summaryLabel: isValid
        ? "Percentages add up to 100%"
        : remaining > 0
          ? `${remaining.toFixed(1)}% left to assign`
          : `${Math.abs(remaining).toFixed(1)}% over-assigned`,
      remainingLabel: isValid ? undefined : `${Math.abs(remaining).toFixed(1)}%`,
      isValid,
    };
  }

  // shares
  let totalShares = 0;
  const shareEntries = participantIds.map((id) => {
    const inputValue = splitValues[id] ?? "1";
    const shares = parsePositive(inputValue) || 0;
    totalShares += shares;
    return { id, shares, inputValue };
  });

  const lines = shareEntries.map(({ id, shares, inputValue }) => ({
    participantId: id,
    displayAmount: totalShares > 0 ? (amount * shares) / totalShares : 0,
    inputValue,
  }));

  return {
    lines,
    summaryLabel:
      totalShares > 0
        ? `Split across ${totalShares} ${totalShares === 1 ? "share" : "shares"}`
        : "Assign at least one share",
    isValid: totalShares > 0,
  };
}

export function defaultSplitValues(
  participantIds: string[],
  splitType: SplitType,
  amount: number,
): Record<string, string> {
  const count = participantIds.length;
  if (count === 0) return {};

  if (splitType === "equal") {
    const each = amount > 0 ? (amount / count).toFixed(2) : "";
    return Object.fromEntries(participantIds.map((id) => [id, each]));
  }

  if (splitType === "percentage") {
    const each = count > 0 ? (100 / count).toFixed(1) : "";
    return Object.fromEntries(participantIds.map((id) => [id, each]));
  }

  if (splitType === "shares") {
    return Object.fromEntries(participantIds.map((id) => [id, "1"]));
  }

  // exact — start empty
  return Object.fromEntries(participantIds.map((id) => [id, ""]));
}
