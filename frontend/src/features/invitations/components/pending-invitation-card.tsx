"use client";

import { formatDistanceToNow } from "@/features/invitations/utils/format-invitation-date";
import type { PendingInvitationItem } from "@/features/invitations/types/ui";
import {
  InvitationStatusChip,
  RegistrationStatusChip,
} from "@/features/invitations/components/invitation-status-chip";
import { UserAvatar } from "@/features/dashboard/components/user-avatar";
import { maskEmail } from "@/features/invitations/utils/mask-email";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Mail, MessageSquare, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PendingInvitationCardProps {
  readonly invitation: PendingInvitationItem;
  readonly onCancel?: (invitation: PendingInvitationItem) => void;
  readonly onResend?: (invitation: PendingInvitationItem) => void;
  readonly onViewDetails?: (invitation: PendingInvitationItem) => void;
  readonly isCancelling?: boolean;
  readonly className?: string;
}

function DeliveryChannelIcons({
  channels,
}: {
  channels: PendingInvitationItem["deliveryChannels"];
}) {
  const hasEmail = channels.includes("email");
  const hasInApp = channels.includes("in_app");

  return (
    <span className={cn("inline-flex items-center gap-1.5", META_TEXT_CLASS)}>
      {hasEmail && <Mail className="size-3.5" aria-hidden="true" />}
      {hasInApp && <Smartphone className="size-3.5" aria-hidden="true" />}
      {!hasEmail && !hasInApp && <MessageSquare className="size-3.5" aria-hidden="true" />}
      {channels.join(" + ")}
    </span>
  );
}

export function PendingInvitationCard({
  invitation,
  onCancel,
  onResend,
  onViewDetails,
  isCancelling = false,
  className,
}: PendingInvitationCardProps) {
  const displayName = invitation.displayName ?? maskEmail(invitation.email);
  const initials = (invitation.displayName ?? invitation.email)
    .split(/[@\s]/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isPending = invitation.status === "pending";
  const canManage = isPending;

  return (
    <article
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-4 shadow-sm",
        "animate-in fade-in slide-in-from-bottom-2 duration-300 min-[375px]:p-5",
        isCancelling && "pointer-events-none opacity-60",
        className,
      )}
      aria-busy={isCancelling}
    >
      <div className="flex items-start gap-3">
        <UserAvatar
          name={displayName}
          avatarUrl={invitation.avatarUrl ?? undefined}
          initials={initials}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          <p className={cn("mt-0.5 truncate", META_TEXT_CLASS)}>{maskEmail(invitation.email)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <InvitationStatusChip
              status={invitation.status}
              isRegistered={invitation.isRegistered}
            />
            <RegistrationStatusChip isRegistered={invitation.isRegistered} />
          </div>
          <p className={cn("mt-2", META_TEXT_CLASS)}>
            Invited {formatDistanceToNow(invitation.invitedAt)}
          </p>
          <div className="mt-1">
            <DeliveryChannelIcons channels={invitation.deliveryChannels} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 min-[375px]:flex-row">
        {onViewDetails && (
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 rounded-xl font-semibold"
            onClick={() => onViewDetails(invitation)}
          >
            View Details
          </Button>
        )}
        {canManage && onResend && (
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 rounded-xl font-semibold"
            onClick={() => onResend(invitation)}
          >
            Resend
          </Button>
        )}
        {canManage && onCancel && (
          <Button
            type="button"
            variant="ghost"
            className="h-10 flex-1 rounded-xl font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isCancelling}
            onClick={() => onCancel(invitation)}
          >
            {isCancelling ? "Cancelling…" : "Cancel"}
          </Button>
        )}
      </div>
    </article>
  );
}
