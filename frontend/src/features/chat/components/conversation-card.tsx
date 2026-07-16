import { BellOff, Pin } from "lucide-react";
import Link from "next/link";
import { chatThreadRoute } from "@/constants/routes";
import { ConversationAvatar } from "@/features/chat/components/conversation-avatar";
import type { ChatConversationPreview } from "@/features/chat/types/ui";
import { formatConversationTime } from "@/features/chat/utils/format-chat-time";
import { META_TEXT_CLASS, META_TEXT_SUBTLE_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface ConversationCardProps {
  conversation: ChatConversationPreview;
  className?: string;
}

export function ConversationCard({ conversation, className }: ConversationCardProps) {
  const hasUnread = conversation.unreadCount > 0;
  const participant = conversation.participants?.[0];

  return (
    <Link
      href={chatThreadRoute(conversation.id)}
      prefetch
      className={cn(
        "group flex min-h-[4.5rem] items-center gap-3 rounded-xl border border-border/80 bg-card px-3 py-3 shadow-sm",
        "transition-all duration-200 hover:border-primary/25 hover:shadow-md active:scale-[0.99]",
        "min-[375px]:gap-3.5 min-[375px]:rounded-2xl min-[375px]:px-4",
        hasUnread && "border-primary/20 bg-primary/[0.03]",
        className,
      )}
      aria-label={`${conversation.title}${
        conversation.type === "direct"
          ? participant?.isOnline
            ? ", online"
            : ", offline"
          : ""
      }${hasUnread ? `, ${conversation.unreadCount} unread` : ""}`}
    >
      <ConversationAvatar
        type={conversation.type}
        title={conversation.title}
        avatarIcon={conversation.avatarIcon}
        avatarUrl={conversation.avatarUrl}
        isOnline={participant?.isOnline}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3
            className={cn(
              "truncate font-heading text-sm font-bold min-[375px]:text-base",
              hasUnread ? "text-foreground" : "text-foreground/90",
            )}
          >
            {conversation.title}
          </h3>

          {conversation.isPinned && (
            <Pin
              className="size-3 shrink-0 text-primary/70"
              aria-label="Pinned"
            />
          )}

          {conversation.isMuted && (
            <BellOff
              className="size-3 shrink-0 text-muted-foreground"
              aria-label="Muted"
            />
          )}

          <span className={cn("ml-auto shrink-0 text-[11px] min-[375px]:text-xs", META_TEXT_SUBTLE_CLASS)}>
            {formatConversationTime(conversation.lastMessageAt)}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2">
          <p
            className={cn(
              "line-clamp-1 flex-1 text-xs min-[375px]:text-sm",
              hasUnread ? "font-medium text-foreground" : META_TEXT_CLASS,
            )}
          >
            {conversation.lastMessagePreview ?? "No messages yet"}
          </p>

          {hasUnread && (
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground min-[375px]:size-[1.375rem] min-[375px]:text-[11px]"
              aria-hidden="true"
            >
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
