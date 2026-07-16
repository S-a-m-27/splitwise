"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConversationAvatar } from "@/features/chat/components/conversation-avatar";
import type { MessageSeenByItem } from "@/features/chat/types/ui";
import { formatDistanceToNow } from "@/features/invitations/utils/format-invitation-date";

interface MessageSeenBySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: MessageSeenByItem[];
}

export function MessageSeenBySheet({
  open,
  onOpenChange,
  items,
}: MessageSeenBySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[70dvh] rounded-t-3xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-heading text-lg">Seen by</SheetTitle>
          <SheetDescription>
            Group members who have read this message.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No one has seen this message yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item) => (
                <li
                  key={item.userId}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-3"
                >
                  <ConversationAvatar
                    type="direct"
                    title={item.displayName}
                    avatarUrl={item.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      Seen {formatDistanceToNow(item.readAt)}
                    </p>
                  </div>
                  <time
                    dateTime={item.readAt}
                    className="shrink-0 text-[11px] text-muted-foreground"
                  >
                    {new Date(item.readAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
