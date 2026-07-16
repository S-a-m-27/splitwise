import type { ChatEventListener } from "@/features/chat/events/chat-events";
import type {
  ConversationSnapshot,
  MarkConversationReadCommand,
  MessageListItem,
  SendMessageCommand,
} from "@/features/chat/types";

export interface ChatSubscription {
  ready: Promise<void>;
  unsubscribe(): Promise<void>;
}

export interface ChatRealtimeGateway {
  subscribeToConversation(
    conversationId: string,
    userId: string,
    listener: ChatEventListener,
  ): ChatSubscription;
  subscribeToConversationActivity(
    conversationId: string,
    userId: string,
    listener: ChatEventListener,
  ): ChatSubscription;
  subscribeToInbox(userId: string, listener: ChatEventListener): ChatSubscription;
  broadcastTyping(
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ): Promise<void>;
}

export interface ChatLifecycleGateway {
  openConversation(conversationId: string): Promise<ConversationSnapshot>;
  sendMessage(command: SendMessageCommand): Promise<MessageListItem>;
  markConversationRead(command: MarkConversationReadCommand): Promise<void>;
  closeConversation(): Promise<void>;
}
