import { ConversationCard } from "@/features/chat/components/conversation-card";
import type { ChatConversationPreview } from "@/features/chat/types/ui";
import { LIST_STACK_CLASS } from "@/components/layout/page-layout";
import { cn } from "@/lib/utils";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConversationListProps {
  conversations: ChatConversationPreview[];
  className?: string;
  onStartDirectMessage?: () => void;
}

export function ConversationList({
  conversations,
  className,
  onStartDirectMessage,
}: ConversationListProps) {
  const pinned = conversations.filter((item) => item.isPinned);
  const recent = conversations.filter((item) => !item.isPinned);
  const groups = recent.filter((item) => item.type === "group");
  const directs = recent.filter((item) => item.type === "direct");

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {pinned.length > 0 && (
        <section aria-label="Pinned conversations">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pinned
          </h2>
          <ul className={LIST_STACK_CLASS}>
            {pinned.map((conversation) => (
              <li key={conversation.id}>
                <ConversationCard conversation={conversation} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {groups.length > 0 && (
        <section aria-label="Group conversations">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Groups
          </h2>
          <ul className={LIST_STACK_CLASS}>
            {groups.map((conversation) => (
              <li key={conversation.id}>
                <ConversationCard conversation={conversation} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Direct messages">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Direct Messages
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Private conversations with other registered users
            </p>
          </div>
          {onStartDirectMessage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 rounded-xl"
              onClick={onStartDirectMessage}
            >
              <MessageSquarePlus className="size-4" aria-hidden="true" />
              New DM
            </Button>
          )}
        </div>
        {directs.length > 0 ? (
          <ul className={LIST_STACK_CLASS}>
            {directs.map((conversation) => (
              <li key={conversation.id}>
                <ConversationCard conversation={conversation} />
              </li>
            ))}
          </ul>
        ) : (
          <button
            type="button"
            onClick={onStartDirectMessage}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-4 text-left transition-colors hover:bg-primary/10"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquarePlus className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">
                Start a private conversation
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Search for someone by name and send them a direct message.
              </span>
            </span>
          </button>
        )}
      </section>
    </div>
  );
}
