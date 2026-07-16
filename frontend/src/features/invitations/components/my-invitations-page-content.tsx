"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { groupDetailRoute, ROUTES } from "@/constants/routes";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { GroupsBackHeader } from "@/features/groups/components/groups-back-header";
import { SectionTitle } from "@/features/dashboard/components/section-title";
import { InvitationCard } from "@/features/invitations/components/invitation-card";
import {
  InvitationDetailsDialog,
  type InvitationDetailsData,
} from "@/features/invitations/components/invitation-details-dialog";
import { InvitationEmptyState } from "@/features/invitations/components/invitation-empty-state";
import { InvitationSkeleton } from "@/features/invitations/components/invitation-skeleton";
import { invitationToast } from "@/features/invitations/components/invitation-toast";
import {
  useAcceptInvitation,
  useDeclineInvitation,
  useInvitationHistory,
} from "@/features/invitations/hooks/use-invitation-ui";
import { getInvitationErrorMessage } from "@/features/invitations/services/invitation.service";
import type { ReceivedInvitationItem } from "@/features/invitations/types/ui";
import { LIST_STACK_CLASS, PageStack, SECTION_STACK_CLASS } from "@/components/layout/page-layout";

export function MyInvitationsPageContent() {
  const router = useRouter();
  const { pending, accepted, declined, isLoading, isError, errorMessage } =
    useInvitationHistory();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();
  const [detailsInvitation, setDetailsInvitation] = useState<InvitationDetailsData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isEmpty = !isLoading && pending.length === 0 && accepted.length === 0 && declined.length === 0;

  function openDetails(invitation: ReceivedInvitationItem) {
    setDetailsInvitation({
      id: invitation.id,
      groupName: invitation.groupName,
      groupIcon: invitation.groupIcon,
      invitedByName: invitation.invitedByName,
      invitedAt: invitation.invitedAt,
      email: invitation.invitedEmail,
      displayName: null,
      isRegistered: true,
      deliveryChannels: invitation.deliveryChannels,
      status: invitation.status,
    });
    setDetailsOpen(true);
  }

  function handleAccept(invitation: ReceivedInvitationItem) {
    acceptInvitation.mutate(invitation.id, {
      onSuccess: () => {
        invitationToast.accepted(invitation.groupName);
        router.push(groupDetailRoute(invitation.groupId));
      },
      onError: (error) => invitationToast.error(getInvitationErrorMessage(error)),
    });
  }

  function handleDecline(invitation: ReceivedInvitationItem) {
    declineInvitation.mutate(invitation.id, {
      onSuccess: () => invitationToast.declined(),
      onError: (error) => invitationToast.error(getInvitationErrorMessage(error)),
    });
  }

  if (isError) {
    return (
      <DashboardShell>
        <GroupsBackHeader title="My Invitations" backHref={ROUTES.dashboard} backLabel="Back" />
        <DashboardErrorState message={errorMessage ?? "Failed to load invitations."} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageStack>
        <GroupsBackHeader
          title="My Invitations"
          backHref={ROUTES.dashboard}
          backLabel="Back"
          description="Review and respond to group invitations."
        />

        {isLoading && <InvitationSkeleton variant="card" count={4} />}

        {isEmpty && <InvitationEmptyState variant="no_invitations" />}

        {!isLoading && pending.length > 0 && (
          <section aria-labelledby="my-pending-heading" className={SECTION_STACK_CLASS}>
            <SectionTitle
              id="my-pending-heading"
              title="Pending"
              subtitle={`${pending.length} invitation${pending.length === 1 ? "" : "s"} waiting`}
            />
            <ul className={LIST_STACK_CLASS}>
              {pending.map((invitation) => (
                <li key={invitation.id}>
                  <InvitationCard
                    invitation={invitation}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    onViewDetails={openDetails}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

        {!isLoading && accepted.length > 0 && (
          <section aria-labelledby="my-accepted-heading" className={SECTION_STACK_CLASS}>
            <SectionTitle id="my-accepted-heading" title="Accepted" subtitle="Groups you've joined" />
            <ul className={LIST_STACK_CLASS}>
              {accepted.map((invitation) => (
                <li key={invitation.id}>
                  <InvitationCard invitation={invitation} onViewDetails={openDetails} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {!isLoading && declined.length > 0 && (
          <section aria-labelledby="my-declined-heading" className={SECTION_STACK_CLASS}>
            <SectionTitle id="my-declined-heading" title="Declined" subtitle="Past invitations" />
            <ul className={LIST_STACK_CLASS}>
              {declined.map((invitation) => (
                <li key={invitation.id}>
                  <InvitationCard invitation={invitation} onViewDetails={openDetails} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {!isLoading && !isEmpty && (
          <p className="text-center text-xs text-muted-foreground">
            Open an invitation from your email for the full detail screen.
          </p>
        )}
      </PageStack>

      <InvitationDetailsDialog
        invitation={detailsInvitation}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </DashboardShell>
  );
}
