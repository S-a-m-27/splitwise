"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ROUTES, groupDetailRoute } from "@/constants/routes";
import { PageStack } from "@/components/layout/page-layout";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { CreateGroupForm } from "@/features/groups/components/create-group-form";
import { GroupsBackHeader } from "@/features/groups/components/groups-back-header";
import { useCreateGroup } from "@/features/groups/hooks/use-groups";
import { getGroupsErrorMessage } from "@/features/groups/services/groups.errors";
import type { CreateGroupFormValues } from "@/features/groups/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function CreateGroupPageContent() {
  const router = useRouter();
  const createGroup = useCreateGroup();

  function handleSubmit(values: CreateGroupFormValues) {
    createGroup.mutate(values, {
      onSuccess: (group) => {
        toast.success(`"${group.name}" created`);
        router.push(groupDetailRoute(group.id));
      },
      onError: (error) => {
        toast.error(getGroupsErrorMessage(error));
      },
    });
  }

  return (
    <DashboardShell>
      <PageStack>
        <GroupsBackHeader title="Create group" backHref={ROUTES.groups} backLabel="Back to groups" />

        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm min-[375px]:rounded-2xl min-[375px]:p-6 md:p-7">
          <p className={cn("mb-6 leading-relaxed", META_TEXT_CLASS)}>
            Set up a new group to track shared expenses. You can invite members after creating it.
          </p>
          <CreateGroupForm
            onSubmit={handleSubmit}
            submitLabel={createGroup.isPending ? "Creating…" : "Create group"}
          />
        </div>
      </PageStack>
    </DashboardShell>
  );
}
