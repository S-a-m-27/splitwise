"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import type { PendingInvitationItem } from "@/features/invitations/types/ui";
import {
  InvitationStatusChip,
  RegistrationStatusChip,
} from "@/features/invitations/components/invitation-status-chip";
import { formatInvitationDate } from "@/features/invitations/utils/format-invitation-date";
import { maskEmail } from "@/features/invitations/utils/mask-email";
import { META_LABEL_CLASS, META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface InvitationDetailsData {
  readonly id: string;
  readonly groupName: string;
  readonly groupIcon: string;
  readonly invitedByName: string;
  readonly invitedAt: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly isRegistered: boolean;
  readonly deliveryChannels: readonly string[];
  readonly status: PendingInvitationItem["status"];
}

interface InvitationDetailsDialogProps {
  readonly invitation: InvitationDetailsData | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

/** Mobile-first bottom sheet; centered dialog from 768px (matches InviteModal). */
const DETAILS_SHELL_CLASS = cn(
  "fixed right-0 bottom-0 left-0 z-50 flex max-h-[92dvh] w-full flex-col overflow-hidden",
  "rounded-t-3xl border border-border bg-card shadow-2xl",
  "transition-all duration-200",
  "data-ending-style:translate-y-8 data-ending-style:opacity-0",
  "data-starting-style:translate-y-8 data-starting-style:opacity-0",
  "min-[768px]:top-1/2 min-[768px]:right-auto min-[768px]:bottom-auto min-[768px]:left-1/2",
  "min-[768px]:max-h-[85vh] min-[768px]:max-w-md",
  "min-[768px]:-translate-x-1/2 min-[768px]:-translate-y-1/2 min-[768px]:rounded-2xl",
  "min-[768px]:data-ending-style:translate-y-0 min-[768px]:data-starting-style:translate-y-0",
  "min-[768px]:data-ending-style:scale-95 min-[768px]:data-starting-style:scale-95",
);

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <dt className={cn("shrink-0 pt-0.5", META_LABEL_CLASS)}>{label}</dt>
      <dd className="max-w-[58%] text-right text-sm font-medium break-words text-foreground">
        {value}
      </dd>
    </div>
  );
}

export function InvitationDetailsDialog({
  invitation,
  open,
  onOpenChange,
}: InvitationDetailsDialogProps) {
  if (!invitation) return null;

  const displayName = invitation.displayName ?? maskEmail(invitation.email);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200",
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
            "supports-backdrop-filter:backdrop-blur-xs",
          )}
        />
        <Dialog.Popup className={DETAILS_SHELL_CLASS}>
          <div
            className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border min-[768px]:hidden"
            aria-hidden="true"
          />

          <header className="relative shrink-0 border-b border-border/60 px-5 pt-3 pb-4 min-[768px]:pt-5">
            <Dialog.Close
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-3 right-3 min-[768px]:top-4 min-[768px]:right-4"
                />
              }
            >
              <X className="size-4" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </Dialog.Close>

            <div className="flex items-start gap-3 pr-10">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-lg"
                aria-hidden="true"
              >
                {invitation.groupIcon}
              </span>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="font-heading text-base font-semibold text-foreground min-[375px]:text-lg">
                  Invitation Details
                </Dialog.Title>
                <Dialog.Description className={cn("mt-1 leading-relaxed", META_TEXT_CLASS)}>
                  {displayName} · {invitation.groupName}
                </Dialog.Description>
              </div>
            </div>
          </header>

          <dl className="min-h-0 flex-1 divide-y divide-border/60 overflow-y-auto overscroll-contain px-5">
            <DetailRow label="Group" value={invitation.groupName} />
            <DetailRow label="Invited By" value={invitation.invitedByName} />
            <DetailRow label="Date" value={formatInvitationDate(invitation.invitedAt)} />
            <DetailRow label="Email" value={maskEmail(invitation.email)} />
            <div className="flex items-center justify-between gap-4 py-3.5">
              <dt className={META_LABEL_CLASS}>Registration</dt>
              <dd>
                <RegistrationStatusChip isRegistered={invitation.isRegistered} />
              </dd>
            </div>
            <DetailRow label="Delivery" value={invitation.deliveryChannels.join(", ")} />
            <div className="flex items-center justify-between gap-4 py-3.5">
              <dt className={META_LABEL_CLASS}>Status</dt>
              <dd>
                <InvitationStatusChip
                  status={invitation.status}
                  isRegistered={invitation.isRegistered}
                />
              </dd>
            </div>
          </dl>

          <footer className="shrink-0 border-t border-border/60 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] min-[768px]:pb-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
