export interface SettlementListItem {
  id: string;
  groupId: string;
  groupName: string;
  groupIcon: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  amountLabel: string;
  notes?: string;
  createdAt: string;
}

export type DebtBreakdownLineType =
  | "expense_owed"
  | "expense_credit"
  | "settlement"
  | "settlement_received";

export interface DebtBreakdownLine {
  readonly id: string;
  readonly type: DebtBreakdownLineType;
  readonly title: string;
  readonly description: string;
  readonly amount: number;
  readonly amountLabel: string;
  readonly dateLabel?: string;
  readonly sortKey: string;
}

export interface DebtBreakdown {
  readonly lines: readonly DebtBreakdownLine[];
  readonly expenseCount: number;
  readonly settlementCount: number;
  readonly calculatedNet: number;
  readonly calculatedNetLabel: string;
}

export interface OutstandingDebt {
  id: string;
  groupId: string;
  groupName: string;
  groupIcon: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  amountLabel: string;
  /** Positive = someone owes you, negative = you owe */
  direction: "you_owe" | "owed_to_you";
  breakdown: DebtBreakdown;
}

export interface CreateSettlementInput {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  notes?: string;
}
