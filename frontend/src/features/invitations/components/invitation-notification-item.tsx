"use client";

import type { InvitationNotificationRow } from "@/features/invitations/services/notification.service";
import { formatDistanceToNow } from "@/features/invitations/utils/format-invitation-date";
import { Bell } from "lucide-react";

interface InvitationNotificationItemProps {
  notification: InvitationNotificationRow;
}

export function InvitationNotificationItem({
  notification,
}: InvitationNotificationItemProps) {
  return (
    <article className="border-b border-border/60 px-4 py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Bell className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{notification.title}</p>
            {!notification.read_at && (
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                aria-label="Unread"
              />
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {notification.body}
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {formatDistanceToNow(notification.created_at)}
          </p>
        </div>
      </div>
    </article>
  );
}
