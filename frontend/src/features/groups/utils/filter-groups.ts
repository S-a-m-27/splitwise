import type { GroupListItem } from "@/features/groups/types";

/** Client-side search filter for the groups list (UI-only). */
export function filterGroups(
  groups: GroupListItem[],
  query: string,
): GroupListItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return groups;

  return groups.filter(
    (group) =>
      group.name.toLowerCase().includes(normalized) ||
      group.lastActivity.toLowerCase().includes(normalized),
  );
}
