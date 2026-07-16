/**
 * Chat feature public API.
 *
 * @module features/chat
 */

export * from "./types";
export * from "./types/ui";

export { chatQueryKeys } from "./constants/query-keys";
export { CHAT_TOAST_MESSAGES } from "./constants/chat-toasts";

// UI components
export { ConversationsPageContent } from "./components/conversations-page-content";
export { ChatThreadPageContent } from "./components/chat-thread-page-content";
export { ChatScreen } from "./components/chat-screen";
export { ConversationList } from "./components/conversation-list";
export { ConversationCard } from "./components/conversation-card";
export { MessageComposer } from "./components/message-composer";
export { GroupChatTab } from "./components/group-chat-tab";

// Hooks and lifecycle view models
export { useConversations, useConversation } from "./hooks/use-conversations";
export { useMessages } from "./hooks/use-messages";
export { useConversationLifecycle } from "./hooks/use-conversation-lifecycle";
export { useConversationSearch } from "./hooks/use-conversation-search";
export { useUnreadCount } from "./hooks/use-unread-count";

export {
  canViewConversation,
  canSendMessage,
  canManageConversation,
  canDeleteMessage,
  canPinMessage,
  canReactToMessage,
} from "./domain/chat-permissions";

export {
  MAX_MESSAGE_LENGTH,
  conversationTypeSchema,
  messageTypeSchema,
  buildDmPairKey,
} from "./validation/chat.schema";

export {
  ChatServiceError,
  ConversationNotFoundError,
  UnauthorizedConversationAccessError,
  DuplicateConversationError,
  AlreadyConversationMemberError,
  MessageTooLongError,
  InvalidConversationTypeError,
  getChatErrorMessage,
  normalizeChatError,
  isChatSessionError,
} from "./services/chat.errors";

export { chatPermissionService } from "./services/chat-permission.service";
export { conversationService } from "./services/conversation.service";
export { messageService } from "./services/message.service";
export { readReceiptService } from "./services/read-receipt.service";
