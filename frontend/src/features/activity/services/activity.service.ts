import { expensesService } from "@/features/expenses/services/expenses.service";
import { groupActivityService } from "@/features/groups/services/group-activity.service";
import { settlementsService } from "@/features/settlements/services/settlements.service";
import { mergeAndSortActivities } from "@/features/activity/utils/map-activity";
import type { ActivityItem } from "@/features/dashboard/types";

export type ActivityFilter = "all" | "expenses" | "settlements";

function mapGroupActivityToItem(
  activity: Awaited<ReturnType<typeof groupActivityService.getGroupActivities>>[number],
  groupName?: string,
): ActivityItem {
  return {
    id: `activity-${activity.id}`,
    description: activity.description,
    groupName: groupName ?? "Group",
    timestamp: new Date(activity.created_at).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    type: "payment",
    sortAt: activity.created_at,
    groupId: activity.group_id,
    targetId: activity.invitation_id ?? activity.id,
  };
}

export const activityService = {
  async getActivityFeed(options?: {
    groupId?: string;
    limit?: number;
    filter?: ActivityFilter;
  }): Promise<ActivityItem[]> {
    const [expenses, settlements, groupActivities] = await Promise.all([
      expensesService.getExpenses(options?.groupId),
      settlementsService.getSettlements(options?.groupId),
      options?.groupId
        ? groupActivityService.getGroupActivities(options.groupId, options.limit ?? 50)
        : Promise.resolve([]),
    ]);

    let items = mergeAndSortActivities(expenses, settlements, {
      groupId: options?.groupId,
      limit: options?.limit,
    });

    if (groupActivities.length > 0) {
      const activityItems = groupActivities.map((row) => mapGroupActivityToItem(row));
      items = [...items, ...activityItems].sort((a, b) => {
        const aTime = new Date(a.sortAt ?? 0).getTime();
        const bTime = new Date(b.sortAt ?? 0).getTime();
        return bTime - aTime;
      });
      if (options?.limit) {
        items = items.slice(0, options.limit);
      }
    }

    if (options?.filter === "expenses") {
      items = items.filter((item) => item.type === "expense");
    } else if (options?.filter === "settlements") {
      items = items.filter((item) => item.type === "settlement");
    }

    return items;
  },
};
