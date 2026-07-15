"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageStack } from "@/components/layout/page-layout";
import { groupDetailRoute } from "@/constants/routes";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { EditGroupForm } from "@/features/groups/components/edit-group-form";
import { GroupsBackHeader } from "@/features/groups/components/groups-back-header";
import { GroupDetailSkeleton } from "@/features/groups/components/groups-skeleton";
import { useGroup, useUpdateGroup } from "@/features/groups/hooks/use-groups";
import { getGroupsErrorMessage } from "@/features/groups/services/groups.errors";
import type { EditGroupFormValues } from "@/features/groups/types";

interface EditGroupPageContentProps {
  groupId: string;
}

export function EditGroupPageContent({ groupId }: EditGroupPageContentProps) {
  const router = useRouter();
  const { data: group, isLoading, isError, errorMessage, refetch } = useGroup(groupId);
  const updateGroup = useUpdateGroup(groupId);

  function handleSubmit(values: EditGroupFormValues) {
    updateGroup.mutate(values, {
      onSuccess: (updated) => {
        toast.success(`"${updated.name}" updated`);
        router.push(groupDetailRoute(groupId));
      },
      onError: (error) => toast.error(getGroupsErrorMessage(error)),
    });
  }

  if (isLoading || !group) {
    return (
      <DashboardShell>
        <PageStack>
          <GroupsBackHeader
            title="Edit group"
            backHref={groupDetailRoute(groupId)}
            backLabel="Back to group"
          />
          {isError ? (
            <DashboardErrorState
              message={errorMessage ?? "Failed to load group."}
              onRetry={() => refetch()}
            />
          ) : (
            <GroupDetailSkeleton />
          )}
        </PageStack>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageStack>
        <GroupsBackHeader
          title="Edit group"
          backHref={groupDetailRoute(group.id)}
          backLabel="Back to group"
        />

        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm min-[375px]:rounded-2xl min-[375px]:p-6 md:p-7">
          <EditGroupForm
            group={group}
            onSubmit={handleSubmit}
          />
        </div>
      </PageStack>
    </DashboardShell>
  );
}
