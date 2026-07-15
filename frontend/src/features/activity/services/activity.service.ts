import { expensesService } from "@/features/expenses/services/expenses.service";
import { settlementsService } from "@/features/settlements/services/settlements.service";
import { mergeAndSortActivities } from "@/features/activity/utils/map-activity";
import type { ActivityItem } from "@/features/dashboard/types";

export type ActivityFilter = "all" | "expenses" | "settlements";

export const activityService = {
  async getActivityFeed(options?: {
    groupId?: string;
    limit?: number;
    filter?: ActivityFilter;
  }): Promise<ActivityItem[]> {
    const [expenses, settlements] = await Promise.all([
      expensesService.getExpenses(options?.groupId),
      settlementsService.getSettlements(options?.groupId),
    ]);

    let items = mergeAndSortActivities(expenses, settlements, {
      groupId: options?.groupId,
      limit: options?.limit,
    });

    if (options?.filter === "expenses") {
      items = items.filter((item) => item.type === "expense");
    } else if (options?.filter === "settlements") {
      items = items.filter((item) => item.type === "settlement");
    }

    return items;
  },
};
