import type {
  ActivityItem,
  BalanceSummary,
  DashboardUser,
  GroupPreview,
} from "@/features/dashboard/types";

/** Aggregated dashboard payload returned by DashboardService.getDashboard(). */
export interface DashboardData {
  user: DashboardUser;
  balanceSummary: BalanceSummary;
  groups: GroupPreview[];
  activities: ActivityItem[];
}
