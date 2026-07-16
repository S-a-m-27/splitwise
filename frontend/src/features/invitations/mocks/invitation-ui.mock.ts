import type {
  InviteSearchResult,
  PendingInvitationItem,
  ReceivedInvitationItem,
} from "@/features/invitations/types/ui";

export const MOCK_RECENT_SEARCHES = [
  "Nimra Khan",
  "khanwaiz@email.com",
  "Sohaib Ali",
] as const;

export const MOCK_SEARCH_USERS: readonly InviteSearchResult[] = [
  {
    id: "user-1",
    displayName: "Nimra Khan",
    email: "nimra.khan@email.com",
    avatarUrl: null,
    isRegistered: true,
    state: "available",
  },
  {
    id: "user-2",
    displayName: "Khanwaiz Ahmed",
    email: "khanwaiz@email.com",
    avatarUrl: null,
    isRegistered: true,
    state: "already_member",
  },
  {
    id: "user-3",
    displayName: "Sohaib Ali",
    email: "sohaib.ali@email.com",
    avatarUrl: null,
    isRegistered: true,
    state: "invitation_pending",
  },
  {
    id: "user-4",
    displayName: "Ayesha Malik",
    email: "ayesha.malik@email.com",
    avatarUrl: null,
    isRegistered: true,
    state: "available",
  },
];

export const MOCK_GROUP_PENDING_INVITATIONS: readonly PendingInvitationItem[] = [
  {
    id: "inv-1",
    groupId: "group-1",
    groupName: "Weekend Trip",
    groupIcon: "🏖️",
    displayName: "Sohaib Ali",
    email: "sohaib.ali@email.com",
    avatarUrl: null,
    status: "pending",
    deliveryChannels: ["email", "in_app"],
    invitedAt: "2026-07-10T14:30:00.000Z",
    isRegistered: true,
    invitedByName: "You",
  },
  {
    id: "inv-2",
    groupId: "group-1",
    groupName: "Weekend Trip",
    groupIcon: "🏖️",
    displayName: null,
    email: "newfriend@gmail.com",
    avatarUrl: null,
    status: "pending",
    deliveryChannels: ["email"],
    invitedAt: "2026-07-12T09:15:00.000Z",
    isRegistered: false,
    invitedByName: "You",
  },
  {
    id: "inv-3",
    groupId: "group-1",
    groupName: "Weekend Trip",
    groupIcon: "🏖️",
    displayName: "Hassan Raza",
    email: "hassan.raza@email.com",
    avatarUrl: null,
    status: "declined",
    deliveryChannels: ["email", "in_app"],
    invitedAt: "2026-07-05T18:00:00.000Z",
    isRegistered: true,
    invitedByName: "You",
  },
];

export const MOCK_RECEIVED_PENDING: readonly ReceivedInvitationItem[] = [
  {
    id: "recv-1",
    groupId: "group-2",
    groupName: "Trip to Murree",
    groupIcon: "🏔️",
    invitedByName: "Ali",
    invitedAt: "2026-07-14T11:00:00.000Z",
    status: "pending",
    deliveryChannels: ["email", "in_app"],
    expiresAt: null,
    invitedEmail: "nimra.khan@email.com",
  },
  {
    id: "recv-2",
    groupId: "group-3",
    groupName: "Roommates",
    groupIcon: "🏠",
    invitedByName: "Sara",
    invitedAt: "2026-07-13T16:45:00.000Z",
    status: "pending",
    deliveryChannels: ["in_app"],
    expiresAt: null,
    invitedEmail: "invitee@email.com",
  },
];

export const MOCK_RECEIVED_ACCEPTED: readonly ReceivedInvitationItem[] = [
  {
    id: "recv-3",
    groupId: "group-4",
    groupName: "Road Trip 2025",
    groupIcon: "🚗",
    invitedByName: "Ayesha Malik",
    invitedAt: "2026-06-20T08:00:00.000Z",
    status: "accepted",
    deliveryChannels: ["email", "in_app"],
    expiresAt: null,
    invitedEmail: "invitee@email.com",
  },
];

export const MOCK_RECEIVED_DECLINED: readonly ReceivedInvitationItem[] = [
  {
    id: "recv-4",
    groupId: "group-5",
    groupName: "Gym Buddies",
    groupIcon: "💪",
    invitedByName: "Hassan Raza",
    invitedAt: "2026-06-01T12:00:00.000Z",
    status: "declined",
    deliveryChannels: ["email"],
    expiresAt: null,
    invitedEmail: "invitee@email.com",
  },
];

export const MOCK_INVITATION_BADGE_COUNT = 2;

export function filterMockSearchResults(query: string): InviteSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return MOCK_SEARCH_USERS.filter(
    (user) =>
      user.displayName.toLowerCase().includes(normalized) ||
      user.email.toLowerCase().includes(normalized),
  );
}

export function isValidEmailQuery(query: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim().toLowerCase());
}

export function findMockPendingInvitation(id: string): PendingInvitationItem | undefined {
  return MOCK_GROUP_PENDING_INVITATIONS.find((item) => item.id === id);
}

export function findMockReceivedInvitation(id: string): ReceivedInvitationItem | undefined {
  return (
    MOCK_RECEIVED_PENDING.find((item) => item.id === id) ??
    MOCK_RECEIVED_ACCEPTED.find((item) => item.id === id) ??
    MOCK_RECEIVED_DECLINED.find((item) => item.id === id)
  );
}
