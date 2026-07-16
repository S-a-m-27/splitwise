"use client";

import { ChatHeader } from "@/features/chat/components/chat-header";
import { ChatErrorState } from "@/features/chat/components/chat-error-state";
import { EmptyChatState } from "@/features/chat/components/empty-chat-state";
import { MessageComposer } from "@/features/chat/components/message-composer";
import { MessageList } from "@/features/chat/components/message-list";
import {
  ChatScreenSkeleton,
  MessageListSkeleton,
} from "@/features/chat/components/chat-skeleton";
import { useConversationLifecycle } from "@/features/chat/hooks/use-conversation-lifecycle";
import type { ChatConversationPreview } from "@/features/chat/types/ui";
import { cn } from "@/lib/utils";

type ChatScreenProps = {
  embedded?: boolean;
  className?: string;
  backHref?: string;
  backLabel?: string;
} & (
  | { conversation: ChatConversationPreview; conversationId?: never }
  | { conversation?: never; conversationId: string }
);

export function ChatScreen({
  conversation,
  conversationId,
  embedded = false,
  className,
  backHref,
  backLabel,
}: ChatScreenProps) {
  const resolvedConversationId = conversation?.id ?? conversationId!;
  const lifecycle = useConversationLifecycle(resolvedConversationId);
  const {
    messages,
    isLoading,
    isError,
    retry,
    retryMessage,
    send,
    loadOlder,
    hasOlderMessages,
    isLoadingOlder,
    typingLabel,
    notifyTyping,
    stopTyping,
  } = lifecycle;
  const resolvedConversation = lifecycle.conversation ?? conversation;

  if (isLoading) {
    return embedded ? (
      <div className={cn("flex min-h-[20rem] flex-col overflow-hidden rounded-xl border border-border/80 bg-card", className)}>
        <ChatScreenSkeleton />
      </div>
    ) : (
      <ChatScreenSkeleton />
    );
  }

  if (isError) {
    return (
      <ChatErrorState
        variant="messages"
        onRetry={() => void retry()}
        className={className}
      />
    );
  }

  if (!resolvedConversation) {
    return <ChatScreenSkeleton />;
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden bg-background",
        embedded
          ? "min-h-[32rem] rounded-xl border border-border/80 shadow-sm min-[375px]:rounded-2xl"
          : "h-[100dvh] max-h-[100dvh] md:border-x md:border-border/60 md:shadow-2xl",
        className,
      )}
    >
      <ChatHeader
        conversation={resolvedConversation}
        embedded={embedded}
        backHref={backHref}
        backLabel={backLabel}
      />

      {messages.length === 0 ? (
        <EmptyChatState typingLabel={typingLabel} />
      ) : (
        <MessageList
          messages={messages}
          conversationType={resolvedConversation.type}
          onRetryMessage={(messageId) => void retryMessage(messageId)}
          hasOlderMessages={hasOlderMessages}
          isLoadingOlder={isLoadingOlder}
          onLoadOlder={() => void loadOlder()}
          typingLabel={typingLabel}
          className="flex-1"
        />
      )}

      <MessageComposer
        showCharacterCount
        onSend={send}
        onTyping={notifyTyping}
        onTypingStop={stopTyping}
        disabled={lifecycle.connectionStatus === "disconnected"}
      />
    </div>
  );
}

/** Lightweight loading state for embedded group tab */
export function GroupChatLoading() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card min-[375px]:rounded-2xl">
      <MessageListSkeleton />
    </div>
  );
}
