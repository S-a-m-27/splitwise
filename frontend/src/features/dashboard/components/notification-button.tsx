"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { InvitationBadge } from "@/features/invitations/components/invitation-badge";
import { NotificationsPanel } from "@/features/invitations/components/notifications-panel";
import { useInvitationBadge } from "@/features/invitations/hooks/use-invitation-ui";
import { Button } from "@/components/ui/button";

/** Opens an integrated notifications panel with inline invitation actions. */
export function NotificationButton() {
  const [open, setOpen] = useState(false);
  const { count, hasUnread } = useInvitationBadge();

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={
          hasUnread
            ? `Notifications, ${count} unread invitation${count === 1 ? "" : "s"}`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative size-10 shrink-0 rounded-xl min-[375px]:size-11"
      >
        <Bell className="size-[1.125rem] min-[375px]:size-5" aria-hidden="true" />
        <InvitationBadge count={count} />
      </Button>

      <NotificationsPanel open={open} onOpenChange={setOpen} />
    </div>
  );
}
