/** TanStack Query keys for profile data — scoped per authenticated user. */
export const profileKeys = {
  all: ["profile"] as const,
  detail: (userId: string | undefined) =>
    [...profileKeys.all, "detail", userId ?? "anonymous"] as const,
  stats: (userId: string | undefined) =>
    [...profileKeys.all, "stats", userId ?? "anonymous"] as const,
};
