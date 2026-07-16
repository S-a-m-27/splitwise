"use client";

import { useState } from "react";
import { ConfirmationDialog } from "@/features/groups/components/confirmation-dialog";
import { LIST_STACK_CLASS, SECTION_STACK_CLASS } from "@/components/layout/page-layout";
import { SectionTitle } from "@/features/dashboard/components/section-title";
import {
  InvitationDetailsDialog,
  type InvitationDetailsData,
} from "@/features/invitations/components/invitation-details-dialog";
import { InvitationEmptyState } from "@/features/invitations/components/invitation-empty-state";
import { InvitationErrorState } from "@/features/invitations/components/invitation-error-state";
import { InvitationSkeleton } from "@/features/invitations/components/invitation-skeleton";
import { invitationToast } from "@/features/invitations/components/invitation-toast";
import { PendingInvitationCard } from "@/features/invitations/components/pending-invitation-card";
import { usePendingInvitations, useCancelInvitation } from "@/features/invitations/hooks/use-invitations";
import { getInvitationErrorMessage } from "@/features/invitations/services/invitation.service";
import type { PendingInvitationItem } from "@/features/invitations/types/ui";

interface GroupPendingInvitationsSectionProps {
  readonly groupId: string;
  readonly groupName: string;
  readonly groupIcon: string;
  readonly isOwnerOrAdmin?: boolean;
}

export function GroupPendingInvitationsSection({
  groupId,
  groupName,
  groupIcon,
  isOwnerOrAdmin = true,
}: GroupPendingInvitationsSectionProps) {
  const { invitations, isLoading, isError, errorMessage } = usePendingInvitations(groupId, {
    groupName,
    groupIcon,
  });
  const cancelInvitation = useCancelInvitation(groupId);
  const [detailsInvitation, setDetailsInvitation] = useState<InvitationDetailsData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<PendingInvitationItem | null>(null);

  if (!isOwnerOrAdmin) return null;

  const pendingOnly = invitations.filter((item) => item.status === "pending");

  function openDetails(invitation: PendingInvitationItem) {
    setDetailsInvitation({
      id: invitation.id,
      groupName: invitation.groupName || groupName,
      groupIcon: invitation.groupIcon || groupIcon,
      invitedByName: invitation.invitedByName,
      invitedAt: invitation.invitedAt,
      email: invitation.email,
      displayName: invitation.displayName,
      isRegistered: invitation.isRegistered,
      deliveryChannels: invitation.deliveryChannels,
      status: invitation.status,
    });
    setDetailsOpen(true);
  }

  function handleCancelConfirm() {
    if (!cancelTarget || cancelInvitation.isPending) return;
    cancelInvitation.mutate(cancelTarget.id, {
      onSuccess: () => {
        invitationToast.cancelled();
        setCancelTarget(null);
      },
      onError: (error) => invitationToast.error(getInvitationErrorMessage(error)),
    });
  }

  function handleCancelDialogOpenChange(open: boolean) {
    if (!open && cancelInvitation.isPending) return;
    if (!open) setCancelTarget(null);
  }

  const cancellingId =
    cancelInvitation.isPending && cancelTarget ? cancelTarget.id : null;

  return (
    <section aria-labelledby="pending-invitations-heading" className={SECTION_STACK_CLASS}>
      <SectionTitle
        id="pending-invitations-heading"
        title="Pending Invitations"
        subtitle={
          pendingOnly.length > 0
            ? `${pendingOnly.length} awaiting response`
            : "No outstanding invites"
        }
      />

      {isLoading && <InvitationSkeleton variant="card" count={2} />}

      {isError && (
        <InvitationErrorState variant="unknown" message={errorMessage ?? undefined} />
      )}

      {!isLoading && !isError && pendingOnly.length === 0 && invitations.length === 0 && (
        <InvitationEmptyState variant="no_pending" />
      )}

      {!isLoading && !isError && pendingOnly.length > 0 && (
        <ul className={LIST_STACK_CLASS}>
          {pendingOnly.map((invitation) => (
            <li key={invitation.id}>
              <PendingInvitationCard
                invitation={invitation}
                onViewDetails={openDetails}
                onResend={undefined}
                onCancel={(item) => setCancelTarget(item)}
                isCancelling={cancellingId === invitation.id}
              />
            </li>
          ))}
        </ul>
      )}

      <InvitationDetailsDialog
        invitation={detailsInvitation}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <ConfirmationDialog
        open={!!cancelTarget}
        onOpenChange={handleCancelDialogOpenChange}
        title="Cancel invitation?"
        description={
          cancelTarget
            ? `This will revoke the invitation sent to ${cancelTarget.displayName ?? cancelTarget.email}.`
            : ""
        }
        confirmLabel="Cancel invitation"
        confirmingLabel="Cancelling…"
        variant="destructive"
        isConfirming={cancelInvitation.isPending}
        onConfirm={handleCancelConfirm}
      />
    </section>
  );
}
