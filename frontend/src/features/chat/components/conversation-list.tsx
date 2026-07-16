import { ConversationCard } from "@/features/chat/components/conversation-card";
import type { ChatConversationPreview } from "@/features/chat/types/ui";
import { LIST_STACK_CLASS } from "@/components/layout/page-layout";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: ChatConversationPreview[];
  className?: string;
}

export function ConversationList({ conversations, className }: ConversationListProps) {
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

      {directs.length > 0 && (
        <section aria-label="Direct messages">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Direct Messages
          </h2>
          <ul className={LIST_STACK_CLASS}>
            {directs.map((conversation) => (
              <li key={conversation.id}>
                <ConversationCard conversation={conversation} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
