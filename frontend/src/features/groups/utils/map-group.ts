import { APP_CONFIG } from "@/constants/config";
import { getInitials } from "@/features/dashboard/utils/get-initials";
import type {
  GroupDetail,
  GroupListItem,
  GroupMember,
  GroupType,
} from "@/features/groups/types";
import { buildInviteUrl } from "@/lib/safe-redirect";
import type {
  GroupMemberRole,
  GroupRow,
} from "@/types/database.types";

const ZERO_BALANCE_SUMMARY = {
  total: 0,
  youOwe: 0,
  youAreOwed: 0,
} as const;

interface MemberWithProfile {
  id: string;
  user_id: string;
  role: GroupMemberRole;
  joined_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface GroupWithMembers extends GroupRow {
  group_members: MemberWithProfile[];
  group_guests: GroupGuestRow[];
}

interface GroupGuestRow {
  id: string;
  display_name: string;
  created_at: string;
}

interface GroupWithCount extends GroupRow {
  group_members: { count: number }[];
  group_guests: { count: number }[];
}

export function formatGroupLastActivity(updatedAt: string): string {
  const date = new Date(updatedAt);
  return `Updated ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function mapGroupListItem(
  row: GroupWithCount,
  balance = 0,
): GroupListItem {
  const memberCount =
    (row.group_members[0]?.count ?? 0) + (row.group_guests[0]?.count ?? 0);

  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    type: row.type as GroupType,
    description: row.description ?? undefined,
    memberCount,
    balance,
    lastActivity: formatGroupLastActivity(row.updated_at),
  };
}

export function mapGroupGuest(guest: GroupGuestRow): GroupMember {
  const name = guest.display_name.trim() || "Guest";

  return {
    id: guest.id,
    name,
    initials: getInitials(name),
    role: "member",
    balance: 0,
    isGuest: true,
  };
}

export function mapGroupMember(
  member: MemberWithProfile,
  currentUserId: string,
  balance = 0,
): GroupMember {
  const profile = member.profiles;
  const name = profile?.full_name?.trim() || "Unknown member";

  return {
    id: member.user_id,
    name,
    initials: getInitials(name),
    avatarUrl: profile?.avatar_url ?? undefined,
    role: member.role,
    balance,
    isCurrentUser: member.user_id === currentUserId,
  };
}

function sortMembers(members: GroupMember[]): GroupMember[] {
  return [...members].sort((a, b) => {
    if (a.isCurrentUser) return -1;
    if (b.isCurrentUser) return 1;
    if (a.role === "owner") return -1;
    if (b.role === "owner") return 1;
    if (a.role === "admin" && b.role === "member") return -1;
    if (a.role === "member" && b.role === "admin") return 1;
    if (a.isGuest && !b.isGuest) return 1;
    if (!a.isGuest && b.isGuest) return -1;
    return a.name.localeCompare(b.name);
  });
}

export function mapGroupDetail(
  row: GroupWithMembers,
  currentUserId: string,
  inviteCode: string,
): GroupDetail {
  const registeredMembers = row.group_members.map((member) =>
    mapGroupMember(member, currentUserId),
  );
  const guests = (row.group_guests ?? []).map(mapGroupGuest);
  const members = sortMembers([...registeredMembers, ...guests]);
  const currentMembership = row.group_members.find(
    (member) => member.user_id === currentUserId,
  );

  const listItem = mapGroupListItem(
    {
      ...row,
      group_members: [{ count: registeredMembers.length }],
      group_guests: [{ count: guests.length }],
    },
    0,
  );

  return {
    ...listItem,
    members,
    expenses: [],
    activities: [],
    balanceSummary: { ...ZERO_BALANCE_SUMMARY },
    inviteLink: buildInviteUrl(inviteCode, APP_CONFIG.url),
    currentUserRole: currentMembership?.role ?? "member",
  };
}
