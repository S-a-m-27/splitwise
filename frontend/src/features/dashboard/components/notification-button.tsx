"use client";

import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Notification control — future module; no badge until backend ships. */
export function NotificationButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Notifications"
      onClick={() =>
        toast.info("Notifications — coming soon", {
          description: "Alerts will appear here in a future update.",
        })
      }
      className="relative size-10 shrink-0 rounded-xl min-[375px]:size-11"
    >
      <Bell className="size-[1.125rem] min-[375px]:size-5" aria-hidden="true" />
    </Button>
  );
}
