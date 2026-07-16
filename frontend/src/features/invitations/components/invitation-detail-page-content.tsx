"use client";

import { useEffect } from "react";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { groupDetailRoute, ROUTES } from "@/constants/routes";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { GroupsBackHeader } from "@/features/groups/components/groups-back-header";
import {
  InvitationErrorState,
} from "@/features/invitations/components/invitation-error-state";
import { InvitationSkeleton } from "@/features/invitations/components/invitation-skeleton";
import { InvitationStatusChip } from "@/features/invitations/components/invitation-status-chip";
import { invitationToast } from "@/features/invitations/components/invitation-toast";
import {
  useAcceptInvitation,
  useDeclineInvitation,
  useInvitationDetail,
} from "@/features/invitations/hooks/use-invitations";
import { isInvitationActionable } from "@/features/invitations/domain/invitation-actionability";
import { getInvitationErrorMessage } from "@/features/invitations/services/invitation.service";
import { PageStack } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface InvitationDetailPageContentProps {
  invitationId: string;
}

export function InvitationDetailPageContent({ invitationId }: InvitationDetailPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const acceptedVia = searchParams.get("via") === "email" ? "email" : "application";
  const { invitation, isLoading, isError, errorMessage } = useInvitationDetail(invitationId);
  const acceptInvitation = useAcceptInvitation({ acceptedVia });
  const declineInvitation = useDeclineInvitation();

  useEffect(() => {
    if (!invitation || invitation.status !== "accepted" || acceptedVia !== "email") return;
    router.replace(groupDetailRoute(invitation.groupId));
  }, [invitation, acceptedVia, router]);

  if (isLoading) {
    return (
      <DashboardShell>
        <PageStack>
          <InvitationSkeleton variant="card" count={1} />
        </PageStack>
      </DashboardShell>
    );
  }

  if (isError) {
    return (
      <DashboardShell>
        <PageStack>
          <GroupsBackHeader
            title="Invitation Details"
            backHref={ROUTES.invitations}
            backLabel="My Invitations"
          />
          <InvitationErrorState variant="network" message={errorMessage ?? undefined} />
        </PageStack>
      </DashboardShell>
    );
  }

  if (!invitation) {
    notFound();
  }

  const isPending = invitation.status === "pending";
  const isActionable = isInvitationActionable(invitation.status, invitation.expiresAt);
  const isMutating = acceptInvitation.isPending || declineInvitation.isPending;

  const groupName = invitation.groupName;
  const groupId = invitation.groupId;

  function handleAccept() {
    acceptInvitation.mutate(invitationId, {
      onSuccess: () => {
        invitationToast.accepted(groupName);
        router.push(groupDetailRoute(groupId));
      },
      onError: (error) => invitationToast.error(getInvitationErrorMessage(error)),
    });
  }

  function handleDecline() {
    declineInvitation.mutate(invitationId, {
      onSuccess: () => {
        invitationToast.declined();
        router.push(ROUTES.invitations);
      },
      onError: (error) => invitationToast.error(getInvitationErrorMessage(error)),
    });
  }

  return (
    <DashboardShell>
      <PageStack>
        <GroupsBackHeader
          title="Invitation Details"
          backHref={ROUTES.invitations}
          backLabel="My Invitations"
        />

        <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted/80 text-xl"
              aria-hidden="true"
            >
              {invitation.groupIcon}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-foreground">{invitation.groupName}</h2>
              <p className={cn("mt-1", META_TEXT_CLASS)}>
                Invited by {invitation.invitedByName}
              </p>
              <div className="mt-3">
                <InvitationStatusChip status={invitation.status} />
              </div>
            </div>
          </div>

          {!isActionable && invitation.status === "pending" && (
            <p className={cn("mt-4 rounded-xl bg-muted/40 px-4 py-3", META_TEXT_CLASS)}>
              This invitation has expired. Ask the group owner to send a new one.
            </p>
          )}

          {!isPending && invitation.status !== "accepted" && (
            <p className={cn("mt-4 rounded-xl bg-muted/40 px-4 py-3", META_TEXT_CLASS)}>
              This invitation is no longer active.
            </p>
          )}

          {isActionable && (
            <div className="mt-5 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 gap-2 rounded-xl font-semibold"
                disabled={isMutating}
                onClick={handleDecline}
              >
                <X className="size-4" aria-hidden="true" />
                {declineInvitation.isPending ? "Declining…" : "Decline"}
              </Button>
              <Button
                type="button"
                className="h-11 flex-1 gap-2 rounded-xl font-semibold"
                disabled={isMutating}
                onClick={handleAccept}
              >
                <Check className="size-4" aria-hidden="true" />
                {acceptInvitation.isPending ? "Accepting…" : "Accept"}
              </Button>
            </div>
          )}

          {invitation.status === "accepted" && (
            <Button
              render={<Link href={groupDetailRoute(invitation.groupId)} />}
              className="mt-5 h-11 w-full rounded-xl font-semibold"
            >
              Open group
            </Button>
          )}
        </section>
      </PageStack>
    </DashboardShell>
  );
}
