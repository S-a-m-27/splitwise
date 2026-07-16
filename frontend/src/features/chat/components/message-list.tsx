"use client";

import { useEffect, useRef } from "react";
import type { ConversationType } from "@/features/chat/types";
import type { DisplayChatMessage } from "@/features/chat/types/ui";
import { DateSeparator } from "@/features/chat/components/date-separator";
import { MessageBubble } from "@/features/chat/components/message-bubble";
import { UnreadDivider } from "@/features/chat/components/unread-divider";
import { TypingIndicator } from "@/features/chat/components/typing-indicator";
import {
  groupMessagesForDisplay,
  insertDateSeparators,
} from "@/features/chat/utils/group-messages";
import type { ChatMessage } from "@/features/chat/types/ui";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: ChatMessage[];
  conversationType: ConversationType;
  className?: string;
  onRetryMessage?: (messageId: string) => void;
  hasOlderMessages?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
  typingLabel?: string | null;
}

export function MessageList({
  messages,
  conversationType,
  className,
  onRetryMessage,
  hasOlderMessages = false,
  isLoadingOlder = false,
  onLoadOlder,
  typingLabel,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFirstId = useRef<string | undefined>(undefined);
  const previousLastId = useRef<string | undefined>(undefined);
  const previousScrollHeight = useRef(0);
  const shouldStickToBottom = useRef(true);
  const displayMessages = groupMessagesForDisplay(messages, conversationType);
  const items = insertDateSeparators(displayMessages);
  const isGroup = conversationType === "group";

  useEffect(() => {
    const container = containerRef.current;
    const firstId = messages[0]?.id;
    const lastMessage = messages.at(-1);
    if (
      container &&
      previousFirstId.current &&
      firstId !== previousFirstId.current
    ) {
      container.scrollTop += container.scrollHeight - previousScrollHeight.current;
    } else if (
      shouldStickToBottom.current ||
      (lastMessage?.isOwn && lastMessage.id !== previousLastId.current)
    ) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    previousFirstId.current = firstId;
    previousLastId.current = lastMessage?.id;
    previousScrollHeight.current = container?.scrollHeight ?? 0;
  }, [messages, typingLabel]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex flex-1 flex-col overflow-y-auto overscroll-contain",
        "bg-[radial-gradient(circle_at_top,color-mix(in_oklch,var(--primary)_6%,transparent),transparent_32%)]",
        className,
      )}
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Message history"
      onScroll={(event) => {
        const distanceFromBottom =
          event.currentTarget.scrollHeight -
          event.currentTarget.scrollTop -
          event.currentTarget.clientHeight;
        shouldStickToBottom.current = distanceFromBottom < 120;
        if (
          event.currentTarget.scrollTop < 80 &&
          hasOlderMessages &&
          !isLoadingOlder
        ) {
          previousScrollHeight.current = event.currentTarget.scrollHeight;
          onLoadOlder?.();
        }
      }}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-3.5 py-5 min-[375px]:px-5 md:px-8 md:py-7">
        {isLoadingOlder && (
          <p className="pb-3 text-center text-xs text-muted-foreground">
            Loading older messages…
          </p>
        )}
        {items.map((item) => {
          if (item.kind === "date") {
            return <DateSeparator key={item.key} label={item.label} />;
          }

          if (item.kind === "unread") {
            return <UnreadDivider key={item.key} />;
          }

          return (
            <MessageBubble
              key={item.key}
              message={item.message as DisplayChatMessage}
              showSenderInGroup={isGroup}
              onRetry={onRetryMessage}
            />
          );
        })}

        {typingLabel && <TypingIndicator label={typingLabel} />}

        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </div>
  );
}
