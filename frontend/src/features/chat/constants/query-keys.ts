export const chatQueryKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatQueryKeys.all, "conversations"] as const,
  conversation: (id: string) => [...chatQueryKeys.conversations(), id] as const,
  groupConversation: (groupId: string) =>
    [...chatQueryKeys.conversations(), "group", groupId] as const,
  directConversation: (otherUserId: string) =>
    [...chatQueryKeys.conversations(), "direct", otherUserId] as const,
  messages: (conversationId: string) =>
    [...chatQueryKeys.all, "messages", conversationId] as const,
  members: (conversationId: string) =>
    [...chatQueryKeys.all, "members", conversationId] as const,
} as const;
