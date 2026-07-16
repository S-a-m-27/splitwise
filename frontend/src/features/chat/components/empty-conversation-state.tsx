import type { ReactNode } from "react";
import { MessageSquare, MessagesSquare, Search } from "lucide-react";
import { EmptyState } from "@/features/groups/components/empty-state";
import { cn } from "@/lib/utils";

type EmptyConversationVariant =
  | "no-conversations"
  | "no-direct"
  | "no-group"
  | "no-search";

const VARIANT_CONFIG: Record<
  EmptyConversationVariant,
  { title: string; description: string; icon: ReactNode }
> = {
  "no-conversations": {
    title: "No conversations yet",
    description:
      "You can privately message another registered user or chat with everyone in a group.",
    icon: <MessagesSquare className="size-6 text-primary" aria-hidden="true" />,
  },
  "no-direct": {
    title: "No direct messages",
    description:
      "Send a private message to another registered user. Search for their name to get started.",
    icon: <MessageSquare className="size-6 text-primary" aria-hidden="true" />,
  },
  "no-group": {
    title: "No group messages",
    description: "Group chats appear here when you join or create a group.",
    icon: <MessagesSquare className="size-6 text-primary" aria-hidden="true" />,
  },
  "no-search": {
    title: "No results found",
    description: "Try a different name, group, or conversation keyword.",
    icon: <Search className="size-6 text-primary" aria-hidden="true" />,
  },
};

interface EmptyConversationStateProps {
  variant?: EmptyConversationVariant;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyConversationState({
  variant = "no-conversations",
  actionLabel,
  onAction,
  className,
}: EmptyConversationStateProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <EmptyState
      title={config.title}
      description={config.description}
      icon={config.icon}
      actionLabel={actionLabel}
      onAction={onAction}
      className={cn(className)}
    />
  );
}
