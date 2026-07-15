/**
 * Groups feature public API.
 *
 * @module features/groups
 */

export { GroupsPage } from "./components/groups-page";
export { GroupsPageContent } from "./components/groups-page-content";
export { GroupCard } from "./components/group-card";
export { MemberCard } from "./components/member-card";
export { ExpenseCard } from "./components/expense-card";
export { GroupActivityCard } from "./components/group-activity-card";
export { GroupHeader } from "./components/group-header";
export { BalanceSummary } from "./components/balance-summary";
export { CreateGroupForm } from "./components/create-group-form";
export { InviteCard } from "./components/invite-card";
export { EmptyState } from "./components/empty-state";
export { SearchBar } from "./components/search-bar";
export { GroupsFab } from "./components/groups-fab";
export { ConfirmationDialog } from "./components/confirmation-dialog";

export { groupsService } from "./services/groups.service";
export {
  useGroups,
  useGroup,
  useInvite,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useLeaveGroup,
  useJoinGroup,
  useGenerateInvite,
  useAddMemberByEmail,
} from "./hooks/use-groups";

export * from "./types";
