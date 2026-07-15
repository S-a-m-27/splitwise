/** TanStack Query keys for dashboard data — scoped per authenticated user. */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  detail: (userId: string | undefined) =>
    [...dashboardKeys.all, userId ?? "anonymous"] as const,
};
