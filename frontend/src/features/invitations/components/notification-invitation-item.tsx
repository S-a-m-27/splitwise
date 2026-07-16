"use client";

import { isInvitationActionable } from "@/features/invitations/domain/invitation-actionability";
import type { ReceivedInvitationItem } from "@/features/invitations/types/ui";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface NotificationInvitationItemProps {
  readonly invitation: ReceivedInvitationItem;
  readonly onAccept?: (invitation: ReceivedInvitationItem) => void;
  readonly onDecline?: (invitation: ReceivedInvitationItem) => void;
  readonly className?: string;
  readonly disabled?: boolean;
}

export function NotificationInvitationItem({
  invitation,
  onAccept,
  onDecline,
  className,
  disabled = false,
}: NotificationInvitationItemProps) {
  const isActionable = isInvitationActionable(invitation.status, invitation.expiresAt);

  return (
    <article
      className={cn(
        "border-b border-border/60 px-4 py-4 last:border-b-0",
        "animate-in fade-in slide-in-from-top-1 duration-200",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-lg"
          aria-hidden="true"
        >
          {invitation.groupIcon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <Mail className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground">
              <span className="font-semibold">{invitation.invitedByName}</span> invited you to{" "}
              <span className="font-semibold">{invitation.groupName}</span>
            </p>
          </div>
        </div>
      </div>

      {isActionable && (onAccept || onDecline) && (
        <div className="mt-3 flex gap-2 pl-[3.25rem]">
          {onDecline && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 flex-1 rounded-xl font-semibold"
              disabled={disabled}
              onClick={() => onDecline(invitation)}
            >
              Decline
            </Button>
          )}
          {onAccept && (
            <Button
              type="button"
              size="sm"
              className="h-9 flex-1 rounded-xl font-semibold"
              disabled={disabled}
              onClick={() => onAccept(invitation)}
            >
              Accept
            </Button>
          )}
        </div>
      )}

      {!isActionable && invitation.status === "pending" && (
        <p className={cn("mt-2 pl-[3.25rem]", META_TEXT_CLASS)}>Expired</p>
      )}

      {!isActionable && invitation.status !== "pending" && (
        <p className={cn("mt-2 pl-[3.25rem] capitalize", META_TEXT_CLASS)}>
          {invitation.status}
        </p>
      )}
    </article>
  );
}
