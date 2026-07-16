import type {
  ChatConnectionStatus,
  ConversationLifecycleStatus,
  ConversationSnapshot,
} from "@/features/chat/types";
import type { ChatDomainEvent } from "@/features/chat/events/chat-events";
import { reconcileMessage } from "@/features/chat/cache/reconcile-chat-cache";

export interface ConversationLifecycleState {
  status: ConversationLifecycleStatus;
  connectionStatus: ChatConnectionStatus;
  snapshot: ConversationSnapshot | null;
  bufferedEvents: ChatDomainEvent[];
  onlineUserIds: string[];
  typingUserIds: string[];
  error: Error | null;
}

export type ConversationLifecycleAction =
  | { type: "OPEN" }
  | { type: "SUBSCRIBED" }
  | { type: "HYDRATED"; snapshot: ConversationSnapshot }
  | { type: "OLDER_MESSAGES_LOADED"; messages: ConversationSnapshot["messages"] }
  | { type: "RECOVERED"; snapshot: ConversationSnapshot }
  | { type: "EVENT"; event: ChatDomainEvent }
  | { type: "RECONNECTING" }
  | { type: "FAILED"; error: Error }
  | { type: "CLOSED" };

export const initialConversationLifecycleState: ConversationLifecycleState = {
  status: "idle",
  connectionStatus: "disconnected",
  snapshot: null,
  bufferedEvents: [],
  onlineUserIds: [],
  typingUserIds: [],
  error: null,
};

export function applyChatDomainEvent(
  snapshot: ConversationSnapshot,
  event: ChatDomainEvent,
): ConversationSnapshot {
  if ("conversationId" in event && event.conversationId !== snapshot.conversation.id) {
    return snapshot;
  }

  switch (event.type) {
    case "message.committed":
    case "message.updated":
      return {
        ...snapshot,
        messages: reconcileMessage(snapshot.messages, event.message),
      };
    case "message.deleted":
      return {
        ...snapshot,
        messages: snapshot.messages.filter((message) => message.id !== event.messageId),
      };
    case "conversation.updated":
      return event.conversation.id === snapshot.conversation.id
        ? {
            ...snapshot,
            conversation: {
              ...snapshot.conversation,
              ...event.conversation,
              title: snapshot.conversation.title,
              avatarIcon: snapshot.conversation.avatarIcon,
              avatarUrl: snapshot.conversation.avatarUrl,
              unreadCount: snapshot.conversation.unreadCount,
            },
          }
        : snapshot;
    case "membership.updated": {
      const isCurrentMember =
        snapshot.currentMember.userId === event.member.userId;
      return {
        ...snapshot,
        members: snapshot.members.map((member) =>
          member.userId === event.member.userId ? event.member : member,
        ),
        currentMember: isCurrentMember ? event.member : snapshot.currentMember,
        conversation: isCurrentMember
          ? { ...snapshot.conversation, unreadCount: event.member.unreadCount }
          : snapshot.conversation,
      };
    }
    case "read-state.updated":
      return snapshot.currentMember.userId === event.userId
        ? {
            ...snapshot,
            currentMember: {
              ...snapshot.currentMember,
              lastReadMessageId: event.messageId,
              unreadCount: event.unreadCount,
            },
            conversation: {
              ...snapshot.conversation,
              unreadCount: event.unreadCount,
            },
          }
        : snapshot;
    case "presence.updated":
    case "typing.updated":
    case "connection.changed":
      return snapshot;
  }
}

export function conversationLifecycleReducer(
  state: ConversationLifecycleState,
  action: ConversationLifecycleAction,
): ConversationLifecycleState {
  switch (action.type) {
    case "OPEN":
      return { ...initialConversationLifecycleState, status: "opening", connectionStatus: "connecting" };
    case "SUBSCRIBED":
      return { ...state, status: "hydrating", connectionStatus: "connected" };
    case "HYDRATED": {
      const snapshot = state.bufferedEvents.reduce(applyChatDomainEvent, action.snapshot);
      return { ...state, status: "ready", snapshot, bufferedEvents: [], error: null };
    }
    case "OLDER_MESSAGES_LOADED":
      if (!state.snapshot) return state;
      return {
        ...state,
        snapshot: {
          ...state.snapshot,
          messages: action.messages.reduce(
            reconcileMessage,
            state.snapshot.messages,
          ),
        },
      };
    case "RECOVERED":
      if (!state.snapshot) {
        return {
          ...state,
          status: "ready",
          connectionStatus: "connected",
          snapshot: action.snapshot,
          error: null,
        };
      }
      return {
        ...state,
        status: "ready",
        connectionStatus: "connected",
        snapshot: {
          ...action.snapshot,
          messages: action.snapshot.messages.reduce(
            reconcileMessage,
            state.snapshot.messages,
          ),
        },
        error: null,
      };
    case "EVENT":
      if (action.event.type === "presence.updated") {
        return { ...state, onlineUserIds: action.event.onlineUserIds };
      }
      if (action.event.type === "typing.updated") {
        return { ...state, typingUserIds: action.event.typingUserIds };
      }
      if (action.event.type === "connection.changed") {
        if (action.event.status === "connected") {
          return {
            ...state,
            status: state.snapshot ? "ready" : state.status,
            connectionStatus: "connected",
          };
        }
        return {
          ...state,
          status: state.snapshot ? "reconnecting" : state.status,
          connectionStatus: action.event.status,
          onlineUserIds: [],
          typingUserIds: [],
        };
      }
      if (!state.snapshot) {
        return { ...state, bufferedEvents: [...state.bufferedEvents, action.event] };
      }
      return { ...state, snapshot: applyChatDomainEvent(state.snapshot, action.event) };
    case "RECONNECTING":
      return {
        ...state,
        status: "reconnecting",
        connectionStatus: "reconnecting",
        onlineUserIds: [],
        typingUserIds: [],
      };
    case "FAILED":
      return { ...state, status: "error", connectionStatus: "disconnected", error: action.error };
    case "CLOSED":
      return { ...initialConversationLifecycleState, status: "closed" };
  }
}
