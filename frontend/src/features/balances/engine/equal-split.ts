import { assertBalanceEngine } from "@/features/balances/engine/errors";
import { distributeCentsEvenly, sumCents } from "@/features/balances/engine/rounding";
import type { SplitStrategy } from "@/features/balances/engine/split-strategy";
import type { ParticipantShare, ValidatedExpense } from "@/features/balances/engine/types";

export function calculateEqualSplit(
  amountCents: number,
  participantIds: readonly string[],
): readonly ParticipantShare[] {
  const shares = distributeCentsEvenly(amountCents, participantIds.length);

  return participantIds.map((userId, index) => ({
    userId,
    shareCents: shares[index]!,
  }));
}

export const equalSplitStrategy: SplitStrategy = {
  type: "equal",
  calculateShares(expense: ValidatedExpense): readonly ParticipantShare[] {
    const shares = calculateEqualSplit(expense.amountCents, expense.participantIds);

    assertBalanceEngine(
      sumCents(shares.map((share) => share.shareCents)) === expense.amountCents,
      "SHARE_SUM_MISMATCH",
      "Equal split shares must sum to the expense amount.",
    );

    return shares;
  },
};
