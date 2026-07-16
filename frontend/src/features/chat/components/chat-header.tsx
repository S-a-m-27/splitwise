import Link from "next/link";
import { ArrowLeft, MoreHorizontal, ShieldCheck, Users } from "lucide-react";
import { ConversationAvatar } from "@/features/chat/components/conversation-avatar";
import { OnlineBadge } from "@/features/chat/components/online-badge";
import type { ChatConversationPreview } from "@/features/chat/types/ui";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  conversation: ChatConversationPreview;
  className?: string;
  embedded?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function ChatHeader({
  conversation,
  className,
  embedded = false,
  backHref,
  backLabel = "Back",
}: ChatHeaderProps) {
  const isGroup = conversation.type === "group";
  const participant = conversation.participants?.[0];
  const isOnline = participant?.isOnline ?? false;

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex min-h-[4.5rem] items-center gap-3 border-b border-border/70 bg-card/90 px-3.5 py-2.5 shadow-sm backdrop-blur-xl",
        "min-[375px]:min-h-[4.75rem] min-[375px]:px-5",
        embedded && "rounded-t-xl min-[375px]:rounded-t-2xl",
        className,
      )}
    >
      {backHref && (
        <Link
          href={backHref}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={backLabel}
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
      )}

      <ConversationAvatar
        type={conversation.type}
        title={conversation.title}
        avatarIcon={conversation.avatarIcon}
        avatarUrl={conversation.avatarUrl}
        isOnline={isOnline}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate font-heading text-base font-bold min-[375px]:text-lg">
            {conversation.title}
          </h2>
          {isGroup && (
            <ShieldCheck className="size-3.5 shrink-0 text-primary/70" aria-label="Private group" />
          )}
          {!isGroup && isOnline && <OnlineBadge />}
        </div>

        {isGroup ? (
          <p className={cn("mt-0.5 flex items-center gap-1.5 text-xs", META_TEXT_CLASS)}>
            <Users className="size-3" aria-hidden="true" />
            <span>
              {conversation.memberCount ?? 0} members
              {conversation.onlineCount !== undefined && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {" "}
                  · {conversation.onlineCount} online
                </span>
              )}
            </span>
          </p>
        ) : (
          <p className={cn("mt-0.5 text-xs", META_TEXT_CLASS)}>
            {isOnline ? "Online" : "Offline"}
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 rounded-full"
              aria-label="Conversation options"
            />
          }
        >
          <MoreHorizontal className="size-5" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled>View details</DropdownMenuItem>
          <DropdownMenuItem disabled>Mute notifications</DropdownMenuItem>
          <DropdownMenuItem disabled>Search in conversation</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
