export {
  INVITATION_KIND,
  INVITATION_STATUS,
  INVITATION_DELIVERY_CHANNEL,
  INVITATION_ACCEPTED_VIA,
  DEFAULT_MEMBER_DELIVERY_CHANNELS,
  EMAIL_ONLY_DELIVERY_CHANNELS,
} from "@/features/invitations/constants/invitation.constants";

export { invitationsKeys } from "@/features/invitations/constants/query-keys";

export type {
  Invitation,
  MemberInvitation,
  ShareLinkInvitation,
  CreateMemberInvitationInput,
  AcceptMemberInvitationInput,
  InvitationListFilters,
} from "@/features/invitations/types";

export type {
  InviteSearchResult,
  PendingInvitationItem,
  ReceivedInvitationItem,
  InvitationEmptyVariant,
  InvitationErrorVariant,
} from "@/features/invitations/types/ui";

export {
  invitationService,
  getInvitationErrorMessage,
} from "@/features/invitations/services/invitation.service";

export {
  InvitationDomainError,
  InvitationServiceError,
  normalizeInvitationError,
  isInvitationSessionError,
} from "@/features/invitations/errors/invitation.errors";

export {
  canTransitionInvitation,
  assertInvitationTransition,
  isTerminalInvitationStatus,
  isInvitationExpired,
} from "@/features/invitations/domain/invitation-state-machine";

export {
  createMemberInvitationSchema,
  acceptMemberInvitationSchema,
  invitationEmailSchema,
} from "@/features/invitations/validation/invitation.schema";

export {
  INVITATION_EVENT,
  buildInvitationRealtimeChannel,
  type InvitationRealtimePayload,
} from "@/features/invitations/events/invitation-events";

export type { EmailProvider, InvitationEmailPayload } from "@/features/invitations/providers/email";

// Transport (Edge Functions)
export { invitationEdgeTransport } from "@/features/invitations/transport/invitation-edge.transport";
export { INVITATION_EDGE_FUNCTION } from "@/features/invitations/transport/types";

// UI hooks (mock data until Phase 3 steps wire real queries)
export {
  useInvitationSearch,
  usePendingInvitations,
  useInvitationBadge,
  useInvitationHistory,
} from "@/features/invitations/hooks/use-invitation-ui";

// UI components
export { InviteButton } from "@/features/invitations/components/invite-button";
export { InviteModal } from "@/features/invitations/components/invite-modal";
export { InviteMembersButton } from "@/features/invitations/components/invite-members-button";
export { InviteSearchInput } from "@/features/invitations/components/invite-search-input";
export { InviteSearchResultList } from "@/features/invitations/components/invite-search-result";
export { RegisteredUserCard } from "@/features/invitations/components/registered-user-card";
export { UnregisteredUserCard } from "@/features/invitations/components/unregistered-user-card";
export { InvitationCard } from "@/features/invitations/components/invitation-card";
export { PendingInvitationCard } from "@/features/invitations/components/pending-invitation-card";
export { InvitationBadge } from "@/features/invitations/components/invitation-badge";
export { InvitationStatusChip, RegistrationStatusChip } from "@/features/invitations/components/invitation-status-chip";
export { InvitationDetailsDialog } from "@/features/invitations/components/invitation-details-dialog";
export { InvitationEmptyState } from "@/features/invitations/components/invitation-empty-state";
export { InvitationErrorState } from "@/features/invitations/components/invitation-error-state";
export { InvitationSkeleton } from "@/features/invitations/components/invitation-skeleton";
export { GroupPendingInvitationsSection } from "@/features/invitations/components/group-pending-invitations-section";
export { MyInvitationsPageContent } from "@/features/invitations/components/my-invitations-page-content";
export { NotificationsPanel } from "@/features/invitations/components/notifications-panel";
export { NotificationInvitationItem } from "@/features/invitations/components/notification-invitation-item";
export { invitationToast } from "@/features/invitations/components/invitation-toast";

export { maskEmail } from "@/features/invitations/utils/mask-email";
