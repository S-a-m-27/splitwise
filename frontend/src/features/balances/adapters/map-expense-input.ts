import { roundDollarsToCents } from "@/features/balances/engine/rounding";
import type { ExpenseInput } from "@/features/balances/engine/types";
import type { ExpenseSplitType } from "@/types/database.types";

export interface BalanceExpenseParticipantRow {
  readonly user_id: string | null;
  readonly guest_id: string | null;
}

export interface BalanceExpenseRow {
  readonly id: string;
  readonly group_id: string;
  readonly amount: number;
  readonly paid_by: string | null;
  readonly paid_by_guest_id: string | null;
  readonly split_type: ExpenseSplitType;
  readonly expense_participants: readonly BalanceExpenseParticipantRow[];
}

function resolveBalanceParticipantId(
  participant: BalanceExpenseParticipantRow,
): string {
  return participant.user_id ?? participant.guest_id ?? "";
}

/** Maps a Supabase expense row to a BalanceEngine expense input. */
export function mapExpenseRowToInput(row: BalanceExpenseRow): ExpenseInput {
  const payerId = row.paid_by ?? row.paid_by_guest_id;
  if (!payerId) {
    throw new Error("Expense must have a payer.");
  }

  return {
    id: row.id,
    groupId: row.group_id,
    amountCents: roundDollarsToCents(Number(row.amount)),
    paidBy: payerId,
    participantIds: row.expense_participants
      .map(resolveBalanceParticipantId)
      .filter((id) => id.length > 0),
    splitType: row.split_type,
  };
}

export function mapExpenseRowsToInput(rows: readonly BalanceExpenseRow[]): ExpenseInput[] {
  return rows.map(mapExpenseRowToInput);
}
