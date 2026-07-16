"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import type { DisplayChatMessage, MessageDeliveryStatus } from "@/features/chat/types/ui";
import { ConversationAvatar } from "@/features/chat/components/conversation-avatar";
import { MessageTimestamp } from "@/features/chat/components/date-separator";
import { MessageContent } from "@/features/chat/components/message-content";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Check,
  CheckCheck,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

const LONG_PRESS_MS = 420;

interface MessageBubbleProps {
  message: DisplayChatMessage;
  showSenderInGroup?: boolean;
  className?: string;
  onRetry?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => Promise<unknown> | unknown;
  onDelete?: (messageId: string) => Promise<unknown> | unknown;
  onViewSeenBy?: (messageId: string) => void;
}

function StatusIcon({ status }: { status?: MessageDeliveryStatus }) {
  if (!status) return null;

  if (status === "read") {
    return <CheckCheck className="size-3 text-sky-400" aria-label="Read" />;
  }

  if (status === "delivered") {
    return (
      <CheckCheck className="size-3 text-muted-foreground" aria-label="Delivered" />
    );
  }

  if (status === "sent") {
    return <Check className="size-3 text-muted-foreground" aria-label="Sent" />;
  }

  if (status === "failed") {
    return <AlertCircle className="size-3 text-destructive" aria-label="Failed to send" />;
  }

  return null;
}

function DeletedLabel({ isOwn }: { isOwn: boolean }) {
  return (
    <p
      className={cn(
        "italic",
        isOwn ? "text-primary-foreground/80" : "text-muted-foreground",
      )}
    >
      This message was deleted
    </p>
  );
}

function useLongPress(onLongPress: () => void, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);

  function clear() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => () => clear(), []);

  if (!enabled) {
    return { bind: {} as const };
  }

  return {
    bind: {
      onPointerDown: (event: PointerEvent) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        didLongPressRef.current = false;
        clear();
        timerRef.current = setTimeout(() => {
          didLongPressRef.current = true;
          onLongPress();
        }, LONG_PRESS_MS);
      },
      onPointerUp: clear,
      onPointerCancel: clear,
      onPointerLeave: clear,
      onContextMenu: (event: MouseEvent) => {
        event.preventDefault();
        didLongPressRef.current = true;
        onLongPress();
      },
    },
  };
}

export function OwnMessageBubble({
  message,
  showSenderInGroup = false,
  className,
  onRetry,
  onEdit,
  onDelete,
  onViewSeenBy,
}: MessageBubbleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [busy, setBusy] = useState(false);
  const isDeleted = Boolean(message.deletedAt);
  const canAct = !isDeleted && Boolean(message.isEditable || onDelete || onViewSeenBy);
  const longPress = useLongPress(() => setMenuOpen(true), canAct && !editing);

  async function handleSaveEdit() {
    if (!onEdit || !draft.trim() || busy) return;
    setBusy(true);
    try {
      await onEdit(message.id, draft.trim());
      setEditing(false);
      setMenuOpen(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || busy) return;
    setBusy(true);
    try {
      await onDelete(message.id);
      setMenuOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "flex justify-end",
        message.showTimestamp ? "mb-5" : "mb-1.5",
        className,
      )}
    >
      <div className="max-w-[82%] min-[375px]:max-w-[76%] md:max-w-[68%]">
        {showSenderInGroup && message.showSenderName && (
          <p className="mb-1.5 pr-1 text-right text-xs font-semibold text-muted-foreground">
            You
          </p>
        )}
        <div
          className={cn(
            "touch-manipulation rounded-[1.25rem] rounded-br-[0.35rem] bg-gradient-to-br from-primary to-primary/85 px-4 py-3 text-[15px] leading-6 text-primary-foreground",
            "shadow-[0_8px_24px_-12px_color-mix(in_oklch,var(--primary)_70%,transparent)]",
            "min-[375px]:px-4.5 min-[375px]:py-3.5",
            isDeleted && "opacity-80",
            canAct && !editing && "active:brightness-95",
          )}
          {...longPress.bind}
        >
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={3}
                autoFocus
                className="w-full resize-none rounded-xl border border-white/20 bg-black/10 px-3 py-2 text-sm text-primary-foreground outline-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-9 min-w-16 text-primary-foreground"
                  onClick={() => setEditing(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 min-w-16 bg-white text-primary hover:bg-white/90"
                  onClick={() => void handleSaveEdit()}
                  disabled={busy || !draft.trim()}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : isDeleted ? (
            <DeletedLabel isOwn />
          ) : (
            <MessageContent
              content={message.content}
              mentionLabels={message.mentionLabels}
              isOwn
            />
          )}
        </div>

        {(message.showTimestamp || canAct) && (
          <div className="mt-1.5 flex items-center justify-end gap-0.5 pr-0.5">
            {message.showTimestamp && message.editedAt && !isDeleted && (
              <span className="mr-1 text-[10px] text-muted-foreground">edited</span>
            )}
            {message.showTimestamp && (
              <>
                <MessageTimestamp iso={message.createdAt} />
                <StatusIcon status={message.status} />
              </>
            )}
            {canAct && (
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
                aria-label="Message actions"
                onClick={() => setMenuOpen(true)}
              >
                <MoreHorizontal className="size-4" />
              </button>
            )}
          </div>
        )}

        {message.status === "failed" && onRetry && (
          <button
            type="button"
            className="mt-1 block min-h-10 w-full text-right text-xs font-semibold text-destructive"
            onClick={() => onRetry(message.id)}
          >
            Failed to send · Retry
          </button>
        )}
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="font-heading text-lg">Message</SheetTitle>
            <SheetDescription>
              Edit within 5 minutes, delete anytime, or see who read it.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-3 flex flex-col gap-1 pb-2">
            {message.isEditable && onEdit && (
              <button
                type="button"
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium active:bg-muted"
                onClick={() => {
                  setDraft(message.content);
                  setEditing(true);
                  setMenuOpen(false);
                }}
              >
                <Pencil className="size-4 text-muted-foreground" />
                Edit message
              </button>
            )}
            {onViewSeenBy && (
              <button
                type="button"
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium active:bg-muted"
                onClick={() => {
                  onViewSeenBy(message.id);
                  setMenuOpen(false);
                }}
              >
                <Eye className="size-4 text-muted-foreground" />
                Seen by
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-destructive active:bg-muted"
                onClick={() => void handleDelete()}
                disabled={busy}
              >
                <Trash2 className="size-4" />
                Delete message
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export function OtherMessageBubble({
  message,
  showSenderInGroup = false,
  className,
}: MessageBubbleProps) {
  const isDeleted = Boolean(message.deletedAt);

  return (
    <div
      className={cn(
        "flex items-end gap-2.5",
        message.showTimestamp ? "mb-5" : "mb-1.5",
        className,
      )}
    >
      <div className="w-9 shrink-0 min-[375px]:w-10">
        {message.showAvatar ? (
          <ConversationAvatar
            type="direct"
            title={message.senderName}
            initials={message.senderInitials}
            avatarUrl={message.senderAvatarUrl}
            size="sm"
            className="!size-9 !text-xs min-[375px]:!size-10"
          />
        ) : (
          <span className="block size-9 min-[375px]:size-10" aria-hidden="true" />
        )}
      </div>

      <div className="max-w-[78%] min-[375px]:max-w-[74%] md:max-w-[66%]">
        {showSenderInGroup && message.showSenderName && (
          <div className="mb-1.5 pl-1">
            <p className="text-xs font-semibold text-primary">{message.senderName}</p>
            {message.senderEmail && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {message.senderEmail}
              </p>
            )}
          </div>
        )}
        <div
          className={cn(
            "rounded-[1.25rem] rounded-bl-[0.35rem] border border-border/70 bg-card px-4 py-3 text-[15px] leading-6 text-foreground",
            "shadow-[0_6px_24px_-16px_rgba(0,0,0,0.45)]",
            "min-[375px]:px-4.5 min-[375px]:py-3.5",
          )}
        >
          {isDeleted ? (
            <DeletedLabel isOwn={false} />
          ) : (
            <MessageContent
              content={message.content}
              mentionLabels={message.mentionLabels}
            />
          )}
        </div>
        {message.showTimestamp && (
          <div className="mt-1.5 flex items-center gap-1.5 pl-1">
            {message.editedAt && !isDeleted && (
              <span className="text-[10px] text-muted-foreground">edited</span>
            )}
            <MessageTimestamp iso={message.createdAt} />
          </div>
        )}
      </div>
    </div>
  );
}

export function MessageBubble(props: MessageBubbleProps) {
  if (props.message.isOwn) {
    return <OwnMessageBubble {...props} />;
  }
  return <OtherMessageBubble {...props} />;
}
