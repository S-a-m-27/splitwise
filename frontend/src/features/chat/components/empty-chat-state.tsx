import { MessageCircle } from "lucide-react";
import { EmptyState } from "@/features/groups/components/empty-state";
import { cn } from "@/lib/utils";

interface EmptyChatStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyChatState({
  title = "No messages yet",
  description = "Say hello and start the conversation. Messages you send will appear here.",
  className,
}: EmptyChatStateProps) {
  return (
    <div className={cn("flex flex-1 items-center justify-center p-6", className)}>
      <EmptyState
        title={title}
        description={description}
        icon={<MessageCircle className="size-6 text-primary" aria-hidden="true" />}
        className="w-full max-w-sm border-none bg-transparent shadow-none"
      />
    </div>
  );
}
