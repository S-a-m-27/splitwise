import { authService } from "@/features/auth/services/auth.service";
import { balancesService } from "@/features/balances/services/balances.service";
import { resolveDisplayName } from "@/features/auth/types";
import type {
  ActivityItem,
  BalanceSummary,
  DashboardUser,
  GroupPreview,
} from "@/features/dashboard/types";
import type { DashboardData } from "@/features/dashboard/types/dashboard-data";
import {
  DashboardServiceError,
  getDashboardErrorMessage,
} from "@/features/dashboard/services/dashboard.errors";
import { getGreeting } from "@/features/dashboard/utils/get-greeting";
import { getInitials } from "@/features/dashboard/utils/get-initials";
import { formatCurrency } from "@/features/dashboard/utils/format-currency";
import { groupsService } from "@/features/groups/services/groups.service";
import { activityService } from "@/features/activity/services/activity.service";

export { getDashboardErrorMessage };

const GROUPS_PREVIEW_LIMIT = 3;

/**
 * Dashboard data service.
 * Reads from Supabase (profiles today). Groups, expenses, and activity
 * return empty/zero until their tables ship in future milestones.
 */
export const dashboardService = {
  /**
   * Fetches all dashboard sections in one call to minimize round-trips.
   * Requires an authenticated user id.
   */
  async getDashboard(userId: string): Promise<DashboardData> {
    const [user, snapshot, groups] = await Promise.all([
      this.getUserProfile(userId),
      balancesService.getBalanceSnapshot(userId),
      groupsService.getGroups(),
    ]);

    return {
      user,
      balanceSummary: snapshot.balanceSummary,
      groups: groups.slice(0, GROUPS_PREVIEW_LIMIT).map((group) => {
        const balance = snapshot.groups[group.id]?.balance ?? 0;

        return {
          id: group.id,
          name: group.name,
          icon: group.icon,
          memberCount: group.memberCount,
          balance,
          balanceLabel: formatCurrency(balance),
          lastActivity: group.lastActivity,
        };
      }),
      activities: await this.getRecentActivity(userId),
    };
  },

  /** Maps the authenticated user's profile to dashboard header data. */
  async getUserProfile(userId: string): Promise<DashboardUser> {
    const { user, error } = await authService.getCurrentUser();

    if (error || !user || user.id !== userId) {
      throw new DashboardServiceError(
        "NO_SESSION",
        "Your session has expired. Please sign in again.",
      );
    }

    const profile = await authService.getProfile(userId);
    const displayName = resolveDisplayName(profile, user);

    if (!profile && !user.email) {
      throw new DashboardServiceError(
        "PROFILE_NOT_FOUND",
        "We could not load your profile. Please try again.",
      );
    }

    return {
      name: displayName,
      greeting: getGreeting(),
      avatarUrl: profile?.avatarUrl,
      initials: getInitials(displayName),
    };
  },

  /**
   * Returns the user's financial summary from the balance engine.
   */
  async getBalanceSummary(userId: string): Promise<BalanceSummary> {
    const snapshot = await balancesService.getBalanceSnapshot(userId);
    return snapshot.balanceSummary;
  },

  /**
   * Returns up to 3 groups for the dashboard preview.
   */
  async getGroupsPreview(userId: string): Promise<GroupPreview[]> {
    const [groups, snapshot] = await Promise.all([
      groupsService.getGroups(),
      balancesService.getBalanceSnapshot(userId),
    ]);

    return groups.slice(0, GROUPS_PREVIEW_LIMIT).map((group) => {
      const balance = snapshot.groups[group.id]?.balance ?? 0;

      return {
        id: group.id,
        name: group.name,
        icon: group.icon,
        memberCount: group.memberCount,
        balance,
        balanceLabel: formatCurrency(balance),
        lastActivity: group.lastActivity,
      };
    });
  },

  /**
   * Returns recent activity feed items from expenses and settlements.
   */
  async getRecentActivity(userId: string, limit = 5): Promise<ActivityItem[]> {
    void userId;
    return activityService.getActivityFeed({ limit });
  },
};
