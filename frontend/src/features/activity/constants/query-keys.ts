export const activityKeys = {
  all: ["activity"] as const,
  feeds: () => [...activityKeys.all, "feed"] as const,
  feed: (userId: string | undefined, groupId?: string) =>
    [...activityKeys.feeds(), userId ?? "anonymous", groupId ?? "all"] as const,
};
