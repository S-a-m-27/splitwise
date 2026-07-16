import type { DisplayChatMessage } from "@/features/chat/types/ui";
import { ConversationAvatar } from "@/features/chat/components/conversation-avatar";
import { MessageTimestamp } from "@/features/chat/components/date-separator";
import { cn } from "@/lib/utils";
import { AlertCircle, Check, CheckCheck } from "lucide-react";
import type { MessageDeliveryStatus } from "@/features/chat/types/ui";
import { MessageContent } from "@/features/chat/components/message-content";

interface MessageBubbleProps {
  message: DisplayChatMessage;
  showSenderInGroup?: boolean;
  className?: string;
  onRetry?: (messageId: string) => void;
}

function StatusIcon({ status }: { status?: MessageDeliveryStatus }) {
  if (!status) return null;

  if (status === "read") {
    return <CheckCheck className="size-3 text-primary" aria-label="Read" />;
  }

  if (status === "delivered" || status === "sent") {
    return <Check className="size-3 text-muted-foreground" aria-label="Sent" />;
  }

  if (status === "failed") {
    return <AlertCircle className="size-3 text-destructive" aria-label="Failed to send" />;
  }

  return null;
}

export function OwnMessageBubble({
  message,
  showSenderInGroup = false,
  className,
  onRetry,
}: MessageBubbleProps) {
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
            "rounded-[1.25rem] rounded-br-[0.35rem] bg-gradient-to-br from-primary to-primary/85 px-4 py-3 text-[15px] leading-6 text-primary-foreground",
            "shadow-[0_8px_24px_-12px_color-mix(in_oklch,var(--primary)_70%,transparent)]",
            "min-[375px]:px-4.5 min-[375px]:py-3.5",
          )}
        >
          <MessageContent
            content={message.content}
            mentionLabels={message.mentionLabels}
            isOwn
          />
        </div>
        {message.showTimestamp && (
          <div className="mt-1.5 flex items-center justify-end gap-1.5 pr-1">
            <MessageTimestamp iso={message.createdAt} />
            <StatusIcon status={message.status} />
          </div>
        )}
        {message.status === "failed" && onRetry && (
          <button
            type="button"
            className="mt-1 block w-full text-right text-xs font-semibold text-destructive"
            onClick={() => onRetry(message.id)}
          >
            Failed to send · Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function OtherMessageBubble({
  message,
  showSenderInGroup = false,
  className,
}: MessageBubbleProps) {
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
          <MessageContent
            content={message.content}
            mentionLabels={message.mentionLabels}
          />
        </div>
        {message.showTimestamp && (
          <MessageTimestamp iso={message.createdAt} className="mt-1.5 pl-1" />
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
