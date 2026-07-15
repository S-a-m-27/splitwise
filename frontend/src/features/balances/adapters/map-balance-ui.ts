import { centsToDollars } from "@/features/balances/engine/rounding";
import type {
  BalanceEngineResult,
  DashboardSummary,
  DebtRelationship,
  GroupBalanceResult,
  UserId,
} from "@/features/balances/engine/types";
import type { BalanceSummary } from "@/features/dashboard/types";
import type { GroupBalanceSummary } from "@/features/groups/types";

export interface GroupBalanceView {
  readonly balance: number;
  readonly balanceSummary: GroupBalanceSummary;
  readonly memberBalances: Readonly<Record<UserId, number>>;
}

export interface BalanceSnapshot {
  readonly balanceSummary: BalanceSummary;
  readonly groups: Readonly<Record<string, GroupBalanceView>>;
}

export function mapDashboardSummaryToUi(summary: DashboardSummary): BalanceSummary {
  return {
    total: centsToDollars(summary.netCents),
    youOwe: centsToDollars(summary.youOweCents),
    youAreOwed: centsToDollars(summary.youAreOwedCents),
  };
}

export function mapUserBalanceToGroupSummary(
  userId: UserId,
  groupResult: GroupBalanceResult,
): GroupBalanceSummary {
  const userBalance = groupResult.userBalances.get(userId);

  if (!userBalance) {
    return { total: 0, youOwe: 0, youAreOwed: 0 };
  }

  return {
    total: centsToDollars(userBalance.netCents),
    youOwe: centsToDollars(userBalance.owedCents),
    youAreOwed: centsToDollars(userBalance.toReceiveCents),
  };
}

/** Bilateral balance between a member and the current user from simplified debts. */
export function mapMemberBilateralBalance(
  memberId: UserId,
  currentUserId: UserId,
  relationships: readonly DebtRelationship[],
): number {
  if (memberId === currentUserId) return 0;

  let balance = 0;

  for (const relationship of relationships) {
    if (relationship.fromUserId === memberId && relationship.toUserId === currentUserId) {
      balance += centsToDollars(relationship.amountCents);
      continue;
    }

    if (relationship.fromUserId === currentUserId && relationship.toUserId === memberId) {
      balance -= centsToDollars(relationship.amountCents);
    }
  }

  return balance;
}

export function mapGroupBalanceView(
  groupId: string,
  currentUserId: UserId,
  result: BalanceEngineResult,
  memberIds: readonly UserId[],
): GroupBalanceView | undefined {
  const groupResult = result.groupBalances.get(groupId);
  if (!groupResult) return undefined;

  const balanceSummary = mapUserBalanceToGroupSummary(currentUserId, groupResult);
  const memberBalances: Record<UserId, number> = {};

  for (const memberId of memberIds) {
    memberBalances[memberId] = mapMemberBilateralBalance(
      memberId,
      currentUserId,
      groupResult.simplifiedRelationships,
    );
  }

  return {
    balance: balanceSummary.total,
    balanceSummary,
    memberBalances,
  };
}

export function mapBalanceEngineResultToSnapshot(
  result: BalanceEngineResult,
  currentUserId: UserId,
  groupMemberIds: Readonly<Record<string, readonly UserId[]>>,
): BalanceSnapshot {
  const balanceSummary = result.dashboard
    ? mapDashboardSummaryToUi(result.dashboard)
    : { total: 0, youOwe: 0, youAreOwed: 0 };

  const groups: Record<string, GroupBalanceView> = {};

  for (const groupId of result.groupBalances.keys()) {
    const view = mapGroupBalanceView(
      groupId,
      currentUserId,
      result,
      groupMemberIds[groupId] ?? [],
    );

    if (view) {
      groups[groupId] = view;
    }
  }

  return { balanceSummary, groups };
}
