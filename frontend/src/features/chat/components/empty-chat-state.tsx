import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/features/groups/components/empty-state";
import { TypingIndicator } from "@/features/chat/components/typing-indicator";
import { cn } from "@/lib/utils";

interface EmptyChatStateProps {
  title?: string;
  description?: string;
  className?: string;
  typingLabel?: string | null;
}

export function EmptyChatState({
  title = "No messages yet",
  description = "Say hello and start the conversation. Messages you send will appear here.",
  className,
  typingLabel,
}: EmptyChatStateProps) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col p-6", className)}>
      <div className="flex flex-1 items-center justify-center">
        <EmptyState
          title={title}
          description={description}
          icon={<MessageCircle className="size-6 text-primary" aria-hidden="true" />}
          className="w-full max-w-sm border-none bg-transparent shadow-none"
        />
      </div>
      {typingLabel && (
        <TypingIndicator
          label={typingLabel}
          className="mx-auto w-full max-w-4xl px-1 pb-0"
        />
      )}
    </div>
  );
}
