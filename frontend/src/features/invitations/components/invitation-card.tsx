"use client";

import type { ReceivedInvitationItem } from "@/features/invitations/types/ui";
import { isInvitationActionable } from "@/features/invitations/domain/invitation-actionability";
import { formatDistanceToNow } from "@/features/invitations/utils/format-invitation-date";
import { InvitationStatusChip } from "@/features/invitations/components/invitation-status-chip";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface InvitationCardProps {
  readonly invitation: ReceivedInvitationItem;
  readonly onAccept?: (invitation: ReceivedInvitationItem) => void;
  readonly onDecline?: (invitation: ReceivedInvitationItem) => void;
  readonly onViewDetails?: (invitation: ReceivedInvitationItem) => void;
  readonly className?: string;
}

export function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  onViewDetails,
  className,
}: InvitationCardProps) {
  const isActionable = isInvitationActionable(invitation.status, invitation.expiresAt);

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-4 shadow-sm",
        "transition-shadow hover:shadow-md min-[375px]:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-muted/80 text-xl"
          aria-hidden="true"
        >
          {invitation.groupIcon}
        </span>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onViewDetails?.(invitation)}
            className="w-full text-left"
          >
            <p className="truncate text-base font-semibold text-foreground">{invitation.groupName}</p>
            <p className={cn("mt-1", META_TEXT_CLASS)}>
              Invited by {invitation.invitedByName}
            </p>
            <p className={cn("mt-0.5", META_TEXT_CLASS)}>
              {formatDistanceToNow(invitation.invitedAt)}
            </p>
          </button>
          <div className="mt-2">
            <InvitationStatusChip status={invitation.status} />
          </div>
        </div>
      </div>

      {isActionable && (onAccept || onDecline) && (
        <div className="mt-4 flex gap-2">
          {onDecline && (
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 gap-2 rounded-xl font-semibold"
              onClick={() => onDecline(invitation)}
            >
              <X className="size-4" aria-hidden="true" />
              Decline
            </Button>
          )}
          {onAccept && (
            <Button
              type="button"
              className="h-11 flex-1 gap-2 rounded-xl font-semibold"
              onClick={() => onAccept(invitation)}
            >
              <Check className="size-4" aria-hidden="true" />
              Accept
            </Button>
          )}
        </div>
      )}
    </article>
  );
}
