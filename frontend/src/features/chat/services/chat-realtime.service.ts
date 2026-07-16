import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import type { ChatDomainEvent, ChatEventListener } from "@/features/chat/events/chat-events";
import type {
  ChatRealtimeGateway,
  ChatSubscription,
} from "@/features/chat/services/chat-contracts";
import {
  mapConversationDetail,
  mapConversationMember,
  mapMessageListItem,
} from "@/features/chat/utils/map-conversation";
import {
  chatPresencePayloadSchema,
  chatTypingPayloadSchema,
} from "@/features/chat/validation/chat.schema";
import { createClient } from "@/lib/supabase/client";

type Row = Record<string, unknown>;

interface ManagedChannel {
  channel: RealtimeChannel;
  listeners: Set<ChatEventListener>;
  ready: Promise<void>;
  remove: () => Promise<unknown>;
}

interface ManagedActivityChannel extends ManagedChannel {
  onlineUserIds: Set<string>;
  typingUserIds: Set<string>;
  typingTimers: Map<string, ReturnType<typeof setTimeout>>;
}

function newRow(payload: RealtimePostgresChangesPayload<Row>): Row {
  return payload.new as Row;
}

function emitTo(listeners: Set<ChatEventListener>, event: ChatDomainEvent): void {
  for (const listener of listeners) listener(event);
}

export class ChatRealtimeService implements ChatRealtimeGateway {
  private readonly conversationDataChannels = new Map<string, ManagedChannel>();
  private readonly activityChannels = new Map<string, ManagedActivityChannel>();
  private readonly inboxChannels = new Map<string, ManagedChannel>();

  subscribeToConversation(
    conversationId: string,
    userId: string,
    listener: ChatEventListener,
  ): ChatSubscription {
    const data = this.subscribeToConversationData(conversationId, listener);
    const activity = this.subscribeToConversationActivity(
      conversationId,
      userId,
      listener,
    );
    return {
      ready: Promise.all([data.ready, activity.ready]).then(() => undefined),
      unsubscribe: async () => {
        await Promise.all([data.unsubscribe(), activity.unsubscribe()]);
      },
    };
  }

  private subscribeToConversationData(
    conversationId: string,
    listener: ChatEventListener,
  ): ChatSubscription {
    const existing = this.conversationDataChannels.get(conversationId);
    if (existing) return this.attach(existing, listener, () =>
      this.removeConversationDataListener(conversationId, listener),
    );

    const supabase = createClient();
    const listeners = new Set<ChatEventListener>([listener]);
    let resolveReady: () => void = () => undefined;
    let rejectReady: (error: Error) => void = () => undefined;
    let readySettled = false;
    const ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    const channel = supabase
      .channel(`chat:data:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            emitTo(listeners, {
              type: "message.deleted",
              conversationId,
              messageId: String((payload.old as Row).id),
            });
            return;
          }
          emitTo(listeners, {
            type:
              payload.eventType === "INSERT"
                ? "message.committed"
                : "message.updated",
            conversationId,
            message: mapMessageListItem(newRow(payload) as never),
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
          filter: `id=eq.${conversationId}`,
        },
        (payload) =>
          emitTo(listeners, {
            type: "conversation.updated",
            conversation: mapConversationDetail(newRow(payload) as never),
          }),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_members",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) =>
          emitTo(listeners, {
            type: "membership.updated",
            conversationId,
            member: mapConversationMember(newRow(payload) as never),
          }),
      );

    channel.subscribe((status, error) => {
      if (status === "SUBSCRIBED") {
        emitTo(listeners, { type: "connection.changed", status: "connected" });
        if (!readySettled) {
          readySettled = true;
          resolveReady();
        }
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        emitTo(listeners, { type: "connection.changed", status: "reconnecting" });
        if (!readySettled) {
          readySettled = true;
          rejectReady(error ?? new Error(`Realtime subscription ${status.toLowerCase()}.`));
        }
      } else if (status === "CLOSED") {
        emitTo(listeners, { type: "connection.changed", status: "disconnected" });
      }
    });

    this.conversationDataChannels.set(conversationId, {
      channel,
      listeners,
      ready,
      remove: () => supabase.removeChannel(channel),
    });
    return {
      ready,
      unsubscribe: () => this.removeConversationDataListener(conversationId, listener),
    };
  }

  subscribeToConversationActivity(
    conversationId: string,
    userId: string,
    listener: ChatEventListener,
  ): ChatSubscription {
    const existing = this.activityChannels.get(conversationId);
    if (existing) {
      const subscription = this.attach(existing, listener, () =>
        this.removeActivityListener(conversationId, listener),
      );
      listener({
        type: "presence.updated",
        conversationId,
        onlineUserIds: [...existing.onlineUserIds].sort(),
      });
      listener({
        type: "typing.updated",
        conversationId,
        typingUserIds: [...existing.typingUserIds].sort(),
      });
      return subscription;
    }

    const supabase = createClient();
    const listeners = new Set<ChatEventListener>([listener]);
    const onlineUserIds = new Set<string>();
    const typingUserIds = new Set<string>();
    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
    let resolveReady: () => void = () => undefined;
    let rejectReady: (error: Error) => void = () => undefined;
    let readySettled = false;
    const ready = new Promise<void>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });
    const topic = `chat:activity:${conversationId}`;
    const channel = supabase
      .channel(topic, {
        config: {
          private: true,
          broadcast: { self: false, ack: false },
          presence: { key: userId },
        },
      })
      .on("presence", { event: "sync" }, () => {
        onlineUserIds.clear();
        const state = channel.presenceState() as Record<string, unknown[]>;
        for (const entries of Object.values(state)) {
          for (const entry of entries) {
            const parsed = chatPresencePayloadSchema.safeParse(entry);
            if (parsed.success) onlineUserIds.add(parsed.data.userId);
          }
        }
        for (const typingUserId of typingUserIds) {
          if (!onlineUserIds.has(typingUserId)) {
            this.clearTypingUser(
              conversationId,
              typingUserId,
              typingUserIds,
              typingTimers,
              listeners,
            );
          }
        }
        emitTo(listeners, {
          type: "presence.updated",
          conversationId,
          onlineUserIds: [...onlineUserIds].sort(),
        });
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const parsed = chatTypingPayloadSchema.safeParse(payload);
        if (!parsed.success || parsed.data.userId === userId) return;
        const typingUserId = parsed.data.userId;
        const priorTimer = typingTimers.get(typingUserId);
        if (priorTimer) clearTimeout(priorTimer);
        if (!parsed.data.isTyping) {
          this.clearTypingUser(
            conversationId,
            typingUserId,
            typingUserIds,
            typingTimers,
            listeners,
          );
          return;
        }
        typingUserIds.add(typingUserId);
        typingTimers.set(
          typingUserId,
          setTimeout(
            () =>
              this.clearTypingUser(
                conversationId,
                typingUserId,
                typingUserIds,
                typingTimers,
                listeners,
              ),
            5_000,
          ),
        );
        emitTo(listeners, {
          type: "typing.updated",
          conversationId,
          typingUserIds: [...typingUserIds].sort(),
        });
      });

    void (async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error || !session) throw error ?? new Error("A session is required for chat activity.");
      await supabase.realtime.setAuth(session.access_token);
      channel.subscribe(async (status, subscriptionError) => {
        if (status === "SUBSCRIBED") {
          const trackStatus = await channel.track({
            userId,
            onlineAt: new Date().toISOString(),
          });
          if (trackStatus !== "ok") {
            emitTo(listeners, {
              type: "connection.changed",
              status: "reconnecting",
            });
            return;
          }
          emitTo(listeners, { type: "connection.changed", status: "connected" });
          if (!readySettled) {
            readySettled = true;
            resolveReady();
          }
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          for (const timer of typingTimers.values()) clearTimeout(timer);
          typingTimers.clear();
          onlineUserIds.clear();
          typingUserIds.clear();
          emitTo(listeners, {
            type: "presence.updated",
            conversationId,
            onlineUserIds: [],
          });
          emitTo(listeners, {
            type: "typing.updated",
            conversationId,
            typingUserIds: [],
          });
          emitTo(listeners, {
            type: "connection.changed",
            status: "reconnecting",
          });
          if (!readySettled) {
            readySettled = true;
            rejectReady(
              subscriptionError ??
                new Error(`Activity subscription ${status.toLowerCase()}.`),
            );
          }
        } else if (status === "CLOSED") {
          for (const timer of typingTimers.values()) clearTimeout(timer);
          typingTimers.clear();
          onlineUserIds.clear();
          typingUserIds.clear();
          emitTo(listeners, {
            type: "presence.updated",
            conversationId,
            onlineUserIds: [],
          });
          emitTo(listeners, {
            type: "typing.updated",
            conversationId,
            typingUserIds: [],
          });
          emitTo(listeners, {
            type: "connection.changed",
            status: "disconnected",
          });
        }
      });
    })().catch((error: unknown) => {
      if (!readySettled) {
        readySettled = true;
        rejectReady(
          error instanceof Error ? error : new Error("Unable to authorize chat activity."),
        );
      }
    });

    this.activityChannels.set(conversationId, {
      channel,
      listeners,
      ready,
      onlineUserIds,
      typingUserIds,
      typingTimers,
      remove: async () => {
        for (const timer of typingTimers.values()) clearTimeout(timer);
        await channel.untrack();
        return supabase.removeChannel(channel);
      },
    });
    return {
      ready,
      unsubscribe: () => this.removeActivityListener(conversationId, listener),
    };
  }

  subscribeToInbox(userId: string, listener: ChatEventListener): ChatSubscription {
    const existing = this.inboxChannels.get(userId);
    if (existing) return this.attach(existing, listener, () =>
      this.removeInboxListener(userId, listener),
    );

    const supabase = createClient();
    const listeners = new Set<ChatEventListener>([listener]);
    let resolveReady: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
      resolveReady = resolve;
    });
    const channel = supabase
      .channel(`chat:inbox:${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) =>
          emitTo(listeners, {
            type: "conversation.updated",
            conversation: mapConversationDetail(newRow(payload) as never),
          }),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_members",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row =
            payload.eventType === "DELETE"
              ? (payload.old as Row)
              : newRow(payload);
          emitTo(listeners, {
            type: "membership.updated",
            conversationId: String(row.conversation_id),
            member: mapConversationMember(row as never),
          });
        },
      );
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        emitTo(listeners, { type: "connection.changed", status: "connected" });
        resolveReady();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        emitTo(listeners, { type: "connection.changed", status: "reconnecting" });
      } else if (status === "CLOSED") {
        emitTo(listeners, { type: "connection.changed", status: "disconnected" });
      }
    });
    this.inboxChannels.set(userId, {
      channel,
      listeners,
      ready,
      remove: () => supabase.removeChannel(channel),
    });
    return {
      ready,
      unsubscribe: () => this.removeInboxListener(userId, listener),
    };
  }

  async broadcastTyping(
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ): Promise<void> {
    const activity = this.activityChannels.get(conversationId);
    if (!activity) return;
    const status = await activity.channel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        userId,
        isTyping,
        sentAt: new Date().toISOString(),
      },
    });
    if (status !== "ok") throw new Error("Unable to synchronize typing state.");
  }

  private attach(
    managed: ManagedChannel,
    listener: ChatEventListener,
    unsubscribe: () => Promise<void>,
  ): ChatSubscription {
    managed.listeners.add(listener);
    return { ready: managed.ready, unsubscribe };
  }

  private clearTypingUser(
    conversationId: string,
    userId: string,
    typingUserIds: Set<string>,
    typingTimers: Map<string, ReturnType<typeof setTimeout>>,
    listeners: Set<ChatEventListener>,
  ): void {
    const timer = typingTimers.get(userId);
    if (timer) clearTimeout(timer);
    typingTimers.delete(userId);
    if (!typingUserIds.delete(userId)) return;
    emitTo(listeners, {
      type: "typing.updated",
      conversationId,
      typingUserIds: [...typingUserIds].sort(),
    });
  }

  private async removeConversationDataListener(
    conversationId: string,
    listener: ChatEventListener,
  ): Promise<void> {
    const managed = this.conversationDataChannels.get(conversationId);
    if (!managed || !this.release(managed, listener)) return;
    this.conversationDataChannels.delete(conversationId);
    await managed.remove();
  }

  private async removeActivityListener(
    conversationId: string,
    listener: ChatEventListener,
  ): Promise<void> {
    const managed = this.activityChannels.get(conversationId);
    if (!managed || !this.release(managed, listener)) return;
    this.activityChannels.delete(conversationId);
    await managed.remove();
  }

  private async removeInboxListener(
    userId: string,
    listener: ChatEventListener,
  ): Promise<void> {
    const managed = this.inboxChannels.get(userId);
    if (!managed || !this.release(managed, listener)) return;
    this.inboxChannels.delete(userId);
    await managed.remove();
  }

  private release(managed: ManagedChannel, listener: ChatEventListener): boolean {
    managed.listeners.delete(listener);
    return managed.listeners.size === 0;
  }
}

export const chatRealtimeService = new ChatRealtimeService();
