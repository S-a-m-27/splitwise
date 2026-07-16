import {
  conversationLifecycleReducer,
  initialConversationLifecycleState,
  type ConversationLifecycleAction,
  type ConversationLifecycleState,
} from "@/features/chat/domain/conversation-lifecycle";
import type { ChatDomainEvent } from "@/features/chat/events/chat-events";
import { conversationService } from "@/features/chat/services/conversation.service";
import {
  type ChatLifecycleGateway,
  type ChatRealtimeGateway,
  type ChatSubscription,
} from "@/features/chat/services/chat-contracts";
import { chatRealtimeService } from "@/features/chat/services/chat-realtime.service";
import { ChatActivityService } from "@/features/chat/services/chat-activity.service";
import { requireChatUserId } from "@/features/chat/services/chat-session";
import { messageService } from "@/features/chat/services/message.service";
import type {
  ConversationSnapshot,
  MarkConversationReadCommand,
  MessageListItem,
  SendMessageCommand,
} from "@/features/chat/types";

export type ConversationStateListener = (state: ConversationLifecycleState) => void;

export interface LifecycleDependencies {
  realtime: ChatRealtimeGateway;
  conversations: Pick<
    typeof conversationService,
    "getConversation" | "listConversationMembers"
  >;
  messages: Pick<
    typeof messageService,
    "listMessagePage" | "sendMessage" | "markConversationRead"
  >;
  getCurrentUserId: () => Promise<string>;
}

export class ChatLifecycleService implements ChatLifecycleGateway {
  private state = initialConversationLifecycleState;
  private subscription: ChatSubscription | null = null;
  private nextMessageCursor: { createdAt: string; id: string } | null = null;
  private readonly listeners = new Set<ConversationStateListener>();
  private readonly activity: ChatActivityService;
  private activeConversationId: string | null = null;
  private activeUserId: string | null = null;
  private recoveryNeeded = false;
  private recoveryInFlight = false;
  private recoveryAttempt = 0;
  private recoveryTimer: ReturnType<typeof setTimeout> | null = null;
  private openGeneration = 0;

  constructor(
    private readonly dependencies: LifecycleDependencies = {
      realtime: chatRealtimeService,
      conversations: conversationService,
      messages: messageService,
      getCurrentUserId: requireChatUserId,
    },
  ) {
    this.activity = new ChatActivityService(dependencies.realtime);
  }

  getState(): ConversationLifecycleState {
    return this.state;
  }

  subscribe(listener: ConversationStateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private dispatch(action: ConversationLifecycleAction): void {
    this.state = conversationLifecycleReducer(this.state, action);
    for (const listener of this.listeners) listener(this.state);
  }

  private handleEvent = (event: ChatDomainEvent): void => {
    if (
      event.type === "connection.changed" &&
      event.status !== "connected"
    ) {
      if (this.activeConversationId) this.activity.clear(this.activeConversationId);
      this.recoveryNeeded = this.activeConversationId !== null;
      this.dispatch({ type: "EVENT", event });
      return;
    }
    this.dispatch({ type: "EVENT", event });
    if (
      event.type === "connection.changed" &&
      event.status === "connected" &&
      this.recoveryNeeded
    ) {
      void this.recoverConversation();
    }
  };

  async openConversation(conversationId: string): Promise<ConversationSnapshot> {
    const generation = ++this.openGeneration;
    await this.closeConversation(false);
    if (generation !== this.openGeneration) {
      throw new Error("Conversation opening was superseded.");
    }
    this.dispatch({ type: "OPEN" });

    try {
      const userId = await this.dependencies.getCurrentUserId();
      if (generation !== this.openGeneration) {
        throw new Error("Conversation opening was superseded.");
      }
      this.activeConversationId = conversationId;
      this.activeUserId = userId;
      this.subscription = this.dependencies.realtime.subscribeToConversation(
        conversationId,
        userId,
        this.handleEvent,
      );
      await this.subscription.ready;
      if (generation !== this.openGeneration) {
        throw new Error("Conversation opening was superseded.");
      }
      this.dispatch({ type: "SUBSCRIBED" });

      const snapshot = await this.loadSnapshot(conversationId, userId);
      if (generation !== this.openGeneration) {
        throw new Error("Conversation opening was superseded.");
      }
      this.dispatch({ type: "HYDRATED", snapshot });
      return this.state.snapshot ?? snapshot;
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error("Unable to open conversation.");
      if (generation === this.openGeneration) {
        this.dispatch({ type: "FAILED", error: normalized });
      }
      throw normalized;
    }
  }

  async sendMessage(command: SendMessageCommand): Promise<MessageListItem> {
    if (this.activeUserId) {
      await this.activity.stopTyping(command.conversationId, this.activeUserId);
    }
    const message = await this.dependencies.messages.sendMessage(command);
    this.handleEvent({
      type: "message.committed",
      conversationId: command.conversationId,
      message,
    });
    return message;
  }

  stageOptimisticMessage(message: MessageListItem): void {
    this.handleEvent({
      type: "message.committed",
      conversationId: message.conversationId,
      message,
    });
  }

  notifyTyping(): void {
    if (!this.activeConversationId || !this.activeUserId) return;
    this.activity.notifyTyping(this.activeConversationId, this.activeUserId);
  }

  async stopTyping(): Promise<void> {
    if (!this.activeConversationId || !this.activeUserId) return;
    await this.activity.stopTyping(this.activeConversationId, this.activeUserId);
  }

  hasOlderMessages(): boolean {
    return this.nextMessageCursor !== null;
  }

  async loadOlderMessages(conversationId: string): Promise<MessageListItem[]> {
    if (!this.nextMessageCursor) return [];
    const page = await this.dependencies.messages.listMessagePage({
      conversationId,
      limit: 50,
      before: this.nextMessageCursor,
    });
    this.nextMessageCursor = page.nextCursor;
    this.dispatch({ type: "OLDER_MESSAGES_LOADED", messages: page.items });
    return page.items;
  }

  async markConversationRead(command: MarkConversationReadCommand): Promise<void> {
    await this.dependencies.messages.markConversationRead(command);
    const userId = await this.dependencies.getCurrentUserId();
    this.handleEvent({
      type: "read-state.updated",
      conversationId: command.conversationId,
      userId,
      messageId: command.messageId,
      unreadCount: 0,
    });
  }

  async closeConversation(invalidateOpen = true): Promise<void> {
    if (invalidateOpen) this.openGeneration += 1;
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
      this.recoveryTimer = null;
    }
    await this.stopTyping();
    if (this.subscription) {
      await this.subscription.unsubscribe();
      this.subscription = null;
    }
    if (this.state.status !== "idle") this.dispatch({ type: "CLOSED" });
    this.nextMessageCursor = null;
    this.activeConversationId = null;
    this.activeUserId = null;
    this.recoveryNeeded = false;
    this.recoveryInFlight = false;
    this.recoveryAttempt = 0;
  }

  private async loadSnapshot(
    conversationId: string,
    userId: string,
  ): Promise<ConversationSnapshot> {
    const [conversation, members, messagePage] = await Promise.all([
      this.dependencies.conversations.getConversation(conversationId),
      this.dependencies.conversations.listConversationMembers(conversationId),
      this.dependencies.messages.listMessagePage({ conversationId, limit: 50 }),
    ]);
    const currentMember = members.find((member) => member.userId === userId);
    if (!currentMember) {
      throw new Error("Active conversation membership was not found.");
    }
    this.nextMessageCursor = messagePage.nextCursor;
    return {
      conversation: { ...conversation, unreadCount: currentMember.unreadCount },
      members,
      messages: messagePage.items,
      currentMember,
    };
  }

  private async recoverConversation(): Promise<void> {
    if (
      this.recoveryInFlight ||
      !this.recoveryNeeded ||
      !this.activeConversationId ||
      !this.activeUserId
    ) {
      return;
    }
    this.recoveryInFlight = true;
    try {
      const snapshot = await this.loadSnapshot(
        this.activeConversationId,
        this.activeUserId,
      );
      this.dispatch({ type: "RECOVERED", snapshot });
      this.recoveryNeeded = false;
      this.recoveryAttempt = 0;
    } catch {
      this.recoveryNeeded = true;
      this.dispatch({ type: "RECONNECTING" });
      const delay = Math.min(1_000 * 2 ** this.recoveryAttempt, 30_000);
      this.recoveryAttempt += 1;
      this.recoveryTimer = setTimeout(() => {
        this.recoveryTimer = null;
        void this.recoverConversation();
      }, delay);
    } finally {
      this.recoveryInFlight = false;
    }
  }
}

export function createChatLifecycleService(): ChatLifecycleService {
  return new ChatLifecycleService();
}
