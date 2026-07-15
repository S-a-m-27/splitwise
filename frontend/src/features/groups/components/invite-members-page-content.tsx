"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { groupDetailRoute } from "@/constants/routes";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { GroupsBackHeader } from "@/features/groups/components/groups-back-header";
import { InviteCard } from "@/features/groups/components/invite-card";
import { AddMemberByEmailForm } from "@/features/groups/components/add-member-by-email-form";
import { AddMemberByNameForm } from "@/features/groups/components/add-member-by-name-form";
import { GroupDetailSkeleton } from "@/features/groups/components/groups-skeleton";
import {
  useAddGuestByName,
  useAddMemberByEmail,
  useGenerateInvite,
  useGroup,
  useInvite,
} from "@/features/groups/hooks/use-groups";
import { getGroupsErrorMessage } from "@/features/groups/services/groups.errors";
import { Button } from "@/components/ui/button";

interface InviteMembersPageContentProps {
  groupId: string;
}

export function InviteMembersPageContent({ groupId }: InviteMembersPageContentProps) {
  const router = useRouter();
  const { data: group, isLoading: groupLoading, isError, errorMessage, refetch } =
    useGroup(groupId);
  const { data: invite, isLoading: inviteLoading } = useInvite(groupId);
  const generateInvite = useGenerateInvite(groupId);
  const addMember = useAddMemberByEmail(groupId);
  const addGuest = useAddGuestByName(groupId);

  const isLoading = groupLoading || inviteLoading || !group;

  useEffect(() => {
    if (group && group.currentUserRole !== "owner") {
      toast.error("Only the group owner can manage invites.");
      router.replace(groupDetailRoute(groupId));
    }
  }, [group, groupId, router]);

  function handleRegenerate() {
    generateInvite.mutate(undefined, {
      onSuccess: () => toast.success("New invite link generated"),
      onError: (error) => toast.error(getGroupsErrorMessage(error)),
    });
  }

  function handleAddMember(email: string) {
    addMember.mutate(email, {
      onSuccess: () => {
        toast.success("Member added to the group");
      },
      onError: (error) => toast.error(getGroupsErrorMessage(error)),
    });
  }

  function handleAddGuest(name: string) {
    addGuest.mutate(name, {
      onSuccess: () => {
        toast.success(`"${name}" added to the group`);
      },
      onError: (error) => toast.error(getGroupsErrorMessage(error)),
    });
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <GroupsBackHeader
          title="Invite members"
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
      </DashboardShell>
    );
  }

  const inviteLink = generateInvite.data?.inviteLink ?? invite?.inviteLink ?? group.inviteLink;

  return (
    <DashboardShell>
      <GroupsBackHeader
        title="Invite members"
        backHref={groupDetailRoute(group.id)}
        backLabel="Back to group"
      />

      <AddMemberByNameForm
        onSubmit={handleAddGuest}
        isSubmitting={addGuest.isPending}
        className="mb-4"
      />

      <AddMemberByEmailForm
        onSubmit={handleAddMember}
        isSubmitting={addMember.isPending}
        className="mb-4"
      />

      <InviteCard inviteLink={inviteLink} groupName={group.name} />

      <Button
        type="button"
        variant="outline"
        className="mt-4 h-11 w-full"
        disabled={generateInvite.isPending}
        onClick={handleRegenerate}
      >
        {generateInvite.isPending ? "Generating…" : "Generate new invite link"}
      </Button>
    </DashboardShell>
  );
}
