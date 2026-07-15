export const groupsKeys = {
  all: ["groups"] as const,
  lists: () => [...groupsKeys.all, "list"] as const,
  list: (userId: string | undefined) =>
    [...groupsKeys.lists(), userId ?? "anonymous"] as const,
  details: () => [...groupsKeys.all, "detail"] as const,
  detail: (groupId: string, userId: string | undefined) =>
    [...groupsKeys.details(), groupId, userId ?? "anonymous"] as const,
  invite: (groupId: string, userId: string | undefined) =>
    [...groupsKeys.all, "invite", groupId, userId ?? "anonymous"] as const,
};
