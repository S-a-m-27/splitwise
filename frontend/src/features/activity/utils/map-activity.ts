import type { ActivityItem } from "@/features/dashboard/types";
import type { GroupActivity } from "@/features/groups/types";
import type { ExpenseListItem } from "@/features/expenses/types";
import type { SettlementListItem } from "@/features/settlements/types";
import { formatExpenseAmount } from "@/features/expenses/utils/format-expense-amount";

function formatActivityTimestamp(iso: string): string {
  if (!iso) return "Recently";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently";

  const datePart = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

export function mapExpenseToActivityItem(expense: ExpenseListItem): ActivityItem {
  return {
    id: `expense-${expense.id}`,
    description: `${expense.paidBy} paid for ${expense.title}`,
    groupName: expense.groupName,
    amount: formatExpenseAmount(expense.amount),
    timestamp: formatActivityTimestamp(expense.createdAtIso),
    type: "expense",
    sortAt: expense.createdAtIso,
    groupId: expense.groupId,
    targetId: expense.id,
  };
}

export function mapSettlementToActivityItem(
  settlement: SettlementListItem,
): ActivityItem {
  return {
    id: `settlement-${settlement.id}`,
    description: `${settlement.fromUserName} paid ${settlement.toUserName}`,
    groupName: settlement.groupName,
    amount: settlement.amountLabel,
    timestamp: formatActivityTimestamp(settlement.createdAt),
    type: "settlement",
    sortAt: settlement.createdAt,
    groupId: settlement.groupId,
    targetId: settlement.id,
  };
}

export function mapActivityToGroupActivity(activity: ActivityItem): GroupActivity {
  const type =
    activity.type === "settlement" || activity.type === "payment"
      ? "settlement"
      : "expense";

  return {
    id: activity.id,
    type,
    description: activity.description,
    timestamp: activity.timestamp,
    amount: activity.amount,
    targetId: activity.targetId,
  };
}

export function mergeAndSortActivities(
  expenses: readonly ExpenseListItem[],
  settlements: readonly SettlementListItem[],
  options?: { groupId?: string; limit?: number },
): ActivityItem[] {
  const expenseItems = expenses.map(mapExpenseToActivityItem);
  const settlementItems = settlements.map(mapSettlementToActivityItem);

  let merged = [...expenseItems, ...settlementItems];

  if (options?.groupId) {
    merged = merged.filter((item) => item.groupId === options.groupId);
  }

  merged.sort((a, b) => {
    const aTime = new Date(a.sortAt ?? 0).getTime();
    const bTime = new Date(b.sortAt ?? 0).getTime();
    return bTime - aTime;
  });

  if (options?.limit) {
    return merged.slice(0, options.limit);
  }

  return merged;
}
