export const invitationsKeys = {
  all: ["invitations"] as const,
  pending: (userId: string) => [...invitationsKeys.all, "pending", userId] as const,
  group: (groupId: string, userId: string) =>
    [...invitationsKeys.all, "group", groupId, userId] as const,
  detail: (invitationId: string, userId: string) =>
    [...invitationsKeys.all, "detail", invitationId, userId] as const,
  badge: (userId: string) => [...invitationsKeys.all, "badge", userId] as const,
  notifications: (userId: string) =>
    [...invitationsKeys.all, "notifications", userId] as const,
  history: (userId: string) => [...invitationsKeys.all, "history", userId] as const,
  search: (groupId: string, query: string) =>
    [...invitationsKeys.all, "search", groupId, query] as const,
};
