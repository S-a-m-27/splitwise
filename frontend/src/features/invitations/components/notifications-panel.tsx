"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { groupDetailRoute, ROUTES } from "@/constants/routes";
import { InvitationEmptyState } from "@/features/invitations/components/invitation-empty-state";
import { InvitationSkeleton } from "@/features/invitations/components/invitation-skeleton";
import { NotificationInvitationItem } from "@/features/invitations/components/notification-invitation-item";
import { InvitationNotificationItem } from "@/features/invitations/components/invitation-notification-item";
import { invitationToast } from "@/features/invitations/components/invitation-toast";
import {
  useAcceptInvitation,
  useDeclineInvitation,
  useInvitationHistory,
  useInvitationNotifications,
} from "@/features/invitations/hooks/use-invitation-ui";
import { getInvitationErrorMessage } from "@/features/invitations/services/invitation.service";
import type { ReceivedInvitationItem } from "@/features/invitations/types/ui";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface NotificationsPanelProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const router = useRouter();
  const { pending, isLoading: invitationsLoading } = useInvitationHistory();
  const {
    notifications,
    isLoading: notificationsLoading,
    markAsRead,
  } = useInvitationNotifications();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [processingId, setProcessingId] = useState<string | null>(null);
  const lastMarkedIds = useRef("");
  const visibleInvitations = useMemo(
    () => pending.filter((invitation) => !dismissedIds.has(invitation.id)),
    [dismissedIds, pending],
  );
  const visibleInvitationIds = useMemo(
    () => new Set(visibleInvitations.map((invitation) => invitation.id)),
    [visibleInvitations],
  );
  const visibleNotifications = useMemo(
    () =>
      notifications
        .filter(
          (notification) =>
            notification.type !== "invitation_received" ||
            !notification.invitation_id ||
            !visibleInvitationIds.has(notification.invitation_id),
        )
        .slice(0, 20),
    [notifications, visibleInvitationIds],
  );
  const unreadNotificationIds = useMemo(
    () => notifications.filter((item) => !item.read_at).map((item) => item.id),
    [notifications],
  );
  const isLoading = invitationsLoading || notificationsLoading;
  const visibleCount = visibleInvitations.length + visibleNotifications.length;

  useEffect(() => {
    if (!open || unreadNotificationIds.length === 0) return;
    const key = unreadNotificationIds.join(",");
    if (lastMarkedIds.current === key) return;
    lastMarkedIds.current = key;
    markAsRead(unreadNotificationIds);
  }, [markAsRead, open, unreadNotificationIds]);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  function handleAccept(invitation: ReceivedInvitationItem) {
    setProcessingId(invitation.id);
    acceptInvitation.mutate(invitation.id, {
      onSuccess: () => {
        invitationToast.accepted(invitation.groupName);
        setDismissedIds((current) => new Set(current).add(invitation.id));
        onOpenChange(false);
        router.push(groupDetailRoute(invitation.groupId));
      },
      onError: (error) => invitationToast.error(getInvitationErrorMessage(error)),
      onSettled: () => setProcessingId(null),
    });
  }

  function handleDecline(invitation: ReceivedInvitationItem) {
    setProcessingId(invitation.id);
    declineInvitation.mutate(invitation.id, {
      onSuccess: () => {
        invitationToast.declined();
        setDismissedIds((current) => new Set(current).add(invitation.id));
      },
      onError: (error) => invitationToast.error(getInvitationErrorMessage(error)),
      onSettled: () => setProcessingId(null),
    });
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30 transition-opacity supports-backdrop-filter:backdrop-blur-[2px] md:bg-black/10"
        aria-label="Close notifications"
        onClick={() => onOpenChange(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-panel-title"
        className={cn(
          "fixed z-50 flex max-h-[min(85dvh,32rem)] flex-col overflow-hidden border border-border bg-card shadow-2xl",
          "animate-in fade-in duration-200",
          "inset-x-0 bottom-0 rounded-t-3xl slide-in-from-bottom-4",
          "md:absolute md:inset-auto md:top-[calc(100%+0.625rem)] md:right-0 md:w-[22rem] md:max-w-[calc(100vw-2rem)]",
          "md:rounded-2xl md:slide-in-from-top-2",
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-3.5">
          <div>
            <h2
              id="notifications-panel-title"
              className="font-heading text-base font-bold text-foreground"
            >
              Notifications
            </h2>
            {visibleCount > 0 && (
              <p className={cn("mt-0.5", META_TEXT_CLASS)}>
                {visibleCount} notification{visibleCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close notifications panel"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-4">
              <InvitationSkeleton variant="list" count={2} />
            </div>
          )}

          {!isLoading && visibleCount === 0 && (
            <div className="p-4">
              <InvitationEmptyState variant="no_invitations" />
            </div>
          )}

          {!isLoading && visibleInvitations.length > 0 && (
            <div role="list" aria-label="Pending invitations">
              {visibleInvitations.map((invitation) => (
                <NotificationInvitationItem
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  disabled={processingId === invitation.id}
                />
              ))}
            </div>
          )}

          {!isLoading && visibleNotifications.length > 0 && (
            <div role="list" aria-label="Invitation notifications">
              {visibleNotifications.map((notification) => (
                <InvitationNotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-border/60 p-3">
          <Link
            href={ROUTES.invitations}
            onClick={() => onOpenChange(false)}
            className="flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            View all
          </Link>
        </footer>
      </div>
    </>
  );
}
