import { assertBalanceEngine } from "@/features/balances/engine/errors";
import type {
  ExpenseInput,
  SettlementInput,
  SplitType,
  ValidatedExpense,
} from "@/features/balances/engine/types";

const SUPPORTED_MVP_SPLIT: SplitType = "equal";

export function validateExpenseInput(expense: ExpenseInput): ValidatedExpense {
  assertBalanceEngine(
    expense.id.length > 0,
    "INVALID_EXPENSE",
    "Expense id is required.",
  );
  assertBalanceEngine(
    expense.groupId.length > 0,
    "INVALID_EXPENSE",
    "Group id is required.",
  );
  assertBalanceEngine(
    expense.amountCents > 0,
    "INVALID_AMOUNT",
    "Expense amount must be greater than zero.",
  );
  assertBalanceEngine(
    Number.isInteger(expense.amountCents),
    "INVALID_AMOUNT",
    "Expense amount must be integer cents.",
  );
  assertBalanceEngine(
    expense.paidBy.length > 0,
    "INVALID_EXPENSE",
    "Paid-by user is required.",
  );
  assertBalanceEngine(
    expense.participantIds.length > 0,
    "EMPTY_PARTICIPANTS",
    "At least one participant is required.",
  );
  assertBalanceEngine(
    expense.splitType === SUPPORTED_MVP_SPLIT,
    "UNSUPPORTED_SPLIT_TYPE",
    `Split type "${expense.splitType}" is not supported in MVP. Use "${SUPPORTED_MVP_SPLIT}".`,
  );

  const uniqueParticipants = new Set(expense.participantIds);
  assertBalanceEngine(
    uniqueParticipants.size === expense.participantIds.length,
    "DUPLICATE_PARTICIPANTS",
    "Participant list must not contain duplicates.",
  );
  assertBalanceEngine(
    uniqueParticipants.has(expense.paidBy),
    "PAID_BY_NOT_PARTICIPANT",
    "Payer must be included in participants.",
  );

  return {
    id: expense.id,
    groupId: expense.groupId,
    amountCents: expense.amountCents,
    paidBy: expense.paidBy,
    participantIds: [...expense.participantIds],
    splitType: "equal",
  };
}

export function validateSettlementInput(settlement: SettlementInput): SettlementInput {
  assertBalanceEngine(
    settlement.id.length > 0,
    "INVALID_SETTLEMENT",
    "Settlement id is required.",
  );
  assertBalanceEngine(
    settlement.groupId.length > 0,
    "INVALID_SETTLEMENT",
    "Group id is required.",
  );
  assertBalanceEngine(
    settlement.amountCents > 0,
    "INVALID_AMOUNT",
    "Settlement amount must be greater than zero.",
  );
  assertBalanceEngine(
    Number.isInteger(settlement.amountCents),
    "INVALID_AMOUNT",
    "Settlement amount must be integer cents.",
  );
  assertBalanceEngine(
    settlement.fromUserId.length > 0 && settlement.toUserId.length > 0,
    "INVALID_SETTLEMENT",
    "Settlement requires both from and to users.",
  );
  assertBalanceEngine(
    settlement.fromUserId !== settlement.toUserId,
    "INVALID_SETTLEMENT",
    "Settlement cannot be between the same user.",
  );

  return settlement;
}

export function validateExpenses(expenses: readonly ExpenseInput[]): readonly ValidatedExpense[] {
  return expenses.map(validateExpenseInput);
}

export function validateSettlements(
  settlements: readonly SettlementInput[] | undefined,
): readonly SettlementInput[] {
  return (settlements ?? []).map(validateSettlementInput);
}
