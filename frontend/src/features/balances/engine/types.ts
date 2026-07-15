/**
 * Domain types for the balance calculation engine.
 * All monetary values use integer cents to avoid floating-point drift.
 */

export type UserId = string;
export type GroupId = string;
export type ExpenseId = string;
export type SettlementId = string;

/** Supported split strategies — MVP implements `equal` only. */
export type SplitType = "equal" | "exact" | "percentage" | "shares" | "unequal";

/** Integer cents — never use floats for money in the engine. */
export type Cents = number;

export interface Money {
  readonly cents: Cents;
}

export interface ExpenseInput {
  readonly id: ExpenseId;
  readonly groupId: GroupId;
  /** Total expense amount in cents (must be > 0). */
  readonly amountCents: Cents;
  readonly paidBy: UserId;
  readonly participantIds: readonly UserId[];
  readonly splitType: SplitType;
}

export interface SettlementInput {
  readonly id: SettlementId;
  readonly groupId: GroupId;
  readonly fromUserId: UserId;
  readonly toUserId: UserId;
  readonly amountCents: Cents;
}

export interface ValidatedExpense extends ExpenseInput {
  readonly splitType: "equal";
  readonly participantIds: readonly UserId[];
}

export interface ParticipantShare {
  readonly userId: UserId;
  readonly shareCents: Cents;
}

export interface ExpenseShareResult {
  readonly expenseId: ExpenseId;
  readonly groupId: GroupId;
  readonly amountCents: Cents;
  readonly paidBy: UserId;
  readonly shares: readonly ParticipantShare[];
  readonly relationships: readonly DebtRelationship[];
}

export interface DebtRelationship {
  readonly fromUserId: UserId;
  readonly toUserId: UserId;
  readonly amountCents: Cents;
}

export interface UserBalance {
  readonly userId: UserId;
  /** Positive = others owe this user; negative = user owes others. */
  readonly netCents: Cents;
  readonly owedCents: Cents;
  readonly toReceiveCents: Cents;
}

export interface GroupBalanceResult {
  readonly groupId: GroupId;
  readonly userBalances: ReadonlyMap<UserId, UserBalance>;
  readonly relationships: readonly DebtRelationship[];
  readonly simplifiedRelationships: readonly DebtRelationship[];
  readonly totalExpensesCents: Cents;
}

export interface DashboardSummary {
  readonly currentUserId: UserId;
  readonly netCents: Cents;
  readonly youOweCents: Cents;
  readonly youAreOwedCents: Cents;
  readonly groupSummaries: readonly GroupDashboardSummary[];
}

export interface GroupDashboardSummary {
  readonly groupId: GroupId;
  readonly netCents: Cents;
  readonly youOweCents: Cents;
  readonly youAreOwedCents: Cents;
}

export interface BalanceEngineInput {
  readonly expenses: readonly ExpenseInput[];
  readonly settlements?: readonly SettlementInput[];
  readonly currentUserId?: UserId;
}

export interface BalanceEngineResult {
  readonly expenseResults: readonly ExpenseShareResult[];
  readonly groupBalances: ReadonlyMap<GroupId, GroupBalanceResult>;
  readonly overallUserBalances: ReadonlyMap<UserId, UserBalance>;
  readonly overallRelationships: readonly DebtRelationship[];
  readonly simplifiedRelationships: readonly DebtRelationship[];
  readonly dashboard?: DashboardSummary;
}

export interface SettlementImpact {
  readonly fromUserId: UserId;
  readonly toUserId: UserId;
  readonly amountCents: Cents;
  readonly updatedRelationships: readonly DebtRelationship[];
  readonly simplifiedRelationships: readonly DebtRelationship[];
}
