import { invitationsKeys } from "@/features/invitations/constants/query-keys";
import { groupsKeys } from "@/features/groups/constants/query-keys";
import { groupsService } from "@/features/groups/services/groups.service";
import type { QueryClient } from "@tanstack/react-query";

/** Centralized realtime invalidation for invitation-related queries. */
export const invitationRealtimeService = {
  async invalidateForUser(
    queryClient: QueryClient,
    userId: string,
    options?: { groupId?: string; invitationId?: string },
  ) {
    void queryClient.invalidateQueries({ queryKey: invitationsKeys.pending(userId) });
    void queryClient.invalidateQueries({ queryKey: invitationsKeys.badge(userId) });
    void queryClient.invalidateQueries({ queryKey: invitationsKeys.notifications(userId) });
    void queryClient.invalidateQueries({ queryKey: invitationsKeys.history(userId) });
    void queryClient.invalidateQueries({ queryKey: groupsKeys.list(userId) });

    if (options?.groupId) {
      void queryClient.invalidateQueries({
        queryKey: invitationsKeys.group(options.groupId, userId),
      });
      void queryClient.invalidateQueries({
        queryKey: groupsKeys.detail(options.groupId, userId),
      });
      await queryClient.prefetchQuery({
        queryKey: groupsKeys.detail(options.groupId, userId),
        queryFn: () => groupsService.getGroup(options.groupId!),
      });
    }

    if (options?.invitationId) {
      void queryClient.invalidateQueries({
        queryKey: invitationsKeys.detail(options.invitationId, userId),
      });
    }
  },

  invalidateAll(queryClient: QueryClient) {
    void queryClient.invalidateQueries({ queryKey: invitationsKeys.all });
  },
};
