"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { mapConversationToUi, mapMessageToUi } from "@/features/chat/adapters/map-chat-ui";
import { chatQueryKeys } from "@/features/chat/constants/query-keys";
import {
  initialConversationLifecycleState,
  type ConversationLifecycleState,
} from "@/features/chat/domain/conversation-lifecycle";
import { createChatLifecycleService } from "@/features/chat/services/chat-lifecycle.service";
import type {
  ConversationListItem,
  MessageListItem,
} from "@/features/chat/types";
import { formatTypingUsers } from "@/features/chat/utils/format-typing-users";
import { listSeenByReceipts } from "@/features/chat/utils/delivery-status";

export function useConversationLifecycle(conversationId: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const service = useMemo(() => createChatLifecycleService(), []);
  const [state, setState] = useState<ConversationLifecycleState>(
    initialConversationLifecycleState,
  );
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const pendingReadTarget = useRef<string | null>(null);
  const readSyncInFlight = useRef(false);

  useEffect(() => {
    const unsubscribe = service.subscribe((next) => {
      setState(next);
      if (!next.snapshot) return;
      queryClient.setQueryData(
        chatQueryKeys.conversation(conversationId),
        next.snapshot.conversation,
      );
      queryClient.setQueryData(
        chatQueryKeys.members(conversationId),
        next.snapshot.members,
      );
    });
    void service.openConversation(conversationId).catch(() => undefined);
    return () => {
      unsubscribe();
      void service.closeConversation();
    };
  }, [conversationId, queryClient, service]);

  const send = useCallback(
    async (content: string, mentionedUserIds: string[] = []) => {
      if (!userId) throw new Error("You must be signed in to send messages.");
      const now = new Date().toISOString();
      const clientMessageId = crypto.randomUUID();
      const optimistic: MessageListItem = {
        id: clientMessageId,
        conversationId,
        senderId: userId,
        senderName: "You",
        messageType: "text",
        content: content.trim(),
        clientMessageId,
        replyToMessageId: null,
        createdAt: now,
        updatedAt: now,
        editedAt: null,
        deletedAt: null,
        mentionedUserIds,
        deliveryStatus: "sending",
      };
      service.stageOptimisticMessage(optimistic);
      try {
        return await service.sendMessage({
          conversationId,
          content,
          clientMessageId,
          messageType: "text",
          mentionedUserIds,
        });
      } catch (error) {
        service.stageOptimisticMessage({ ...optimistic, deliveryStatus: "failed" });
        throw error;
      }
    },
    [conversationId, service, userId],
  );

  const markRead = useCallback(
    async (messageId: string) => {
      await service.markConversationRead({ conversationId, messageId });
      queryClient.setQueryData<ConversationListItem[]>(
        chatQueryKeys.conversations(),
        (current = []) =>
          current.map((item) =>
            item.id === conversationId ? { ...item, unreadCount: 0 } : item,
          ),
      );
    },
    [conversationId, queryClient, service],
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      const message = service
        .getState()
        .snapshot?.messages.find((item) => item.id === messageId);
      if (!message?.clientMessageId || !message.content) return;
      service.stageOptimisticMessage({ ...message, deliveryStatus: "sending" });
      try {
        return await service.sendMessage({
          conversationId,
          content: message.content,
          clientMessageId: message.clientMessageId,
          messageType: message.messageType,
          mentionedUserIds: message.mentionedUserIds,
        });
      } catch (error) {
        service.stageOptimisticMessage({ ...message, deliveryStatus: "failed" });
        throw error;
      }
    },
    [conversationId, service],
  );

  const loadOlder = useCallback(async () => {
    if (isLoadingOlder || !service.hasOlderMessages()) return;
    setIsLoadingOlder(true);
    try {
      await service.loadOlderMessages(conversationId);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [conversationId, isLoadingOlder, service]);
  const notifyTyping = useCallback(() => service.notifyTyping(), [service]);
  const stopTyping = useCallback(() => service.stopTyping(), [service]);

  useEffect(() => {
    const latestMessage = state.snapshot?.messages.at(-1);
    if (!latestMessage || !state.snapshot?.currentMember.unreadCount) return;
    pendingReadTarget.current = latestMessage.id;
    if (readSyncInFlight.current) return;
    readSyncInFlight.current = true;
    void (async () => {
      try {
        while (pendingReadTarget.current) {
          const messageId = pendingReadTarget.current;
          pendingReadTarget.current = null;
          await markRead(messageId);
        }
      } catch {
        // Realtime membership updates or reconnect hydration will retry.
      } finally {
        readSyncInFlight.current = false;
      }
    })();
  }, [markRead, state.snapshot]);

  const snapshot = state.snapshot;
  const conversation =
    snapshot && user
      ? mapConversationToUi(
          snapshot.conversation,
          snapshot.members,
          user.id,
          state.onlineUserIds,
        )
      : null;
  const messages =
    snapshot && user
      ? snapshot.messages.map((message) =>
          mapMessageToUi(
            message,
            user.id,
            snapshot.members,
            snapshot.receipts,
            snapshot.conversation.type,
            snapshot.messages,
          ),
        )
      : [];
  const typingNames =
    snapshot && user
      ? state.typingUserIds
          .filter((typingUserId) => typingUserId !== user.id)
          .map((typingUserId) => {
            const member = snapshot.members.find(
              (candidate) => candidate.userId === typingUserId,
            );
            return member?.displayName?.trim() || member?.email || "Another participant";
          })
      : [];

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      return service.editMessage({ messageId, content });
    },
    [service],
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      return service.deleteMessage({ messageId });
    },
    [service],
  );

  const getSeenBy = useCallback(
    (messageId: string) => {
      if (!snapshot || !user) return [];
      return listSeenByReceipts(
        messageId,
        snapshot.members,
        snapshot.receipts,
        user.id,
      );
    },
    [snapshot, user],
  );

  return {
    state,
    conversation,
    messages,
    members: snapshot?.members ?? [],
    currentUserId: userId,
    isLoading: state.status === "idle" || state.status === "opening" || state.status === "hydrating",
    isError: state.status === "error",
    error: state.error,
    connectionStatus: state.connectionStatus,
    typingLabel: formatTypingUsers(typingNames),
    isTyping: typingNames.length > 0,
    notifyTyping,
    stopTyping,
    send,
    markRead,
    editMessage,
    deleteMessage,
    getSeenBy,
    retry: () => service.openConversation(conversationId),
    retryMessage,
    loadOlder,
    hasOlderMessages: service.hasOlderMessages(),
    isLoadingOlder,
  };
}
