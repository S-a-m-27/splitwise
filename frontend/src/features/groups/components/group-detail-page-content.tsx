"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { HandCoins, Receipt } from "lucide-react";
import {
  expenseNewRoute,
  ROUTES,
} from "@/constants/routes";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { BalanceSummary } from "@/features/groups/components/balance-summary";
import { ConfirmationDialog } from "@/features/groups/components/confirmation-dialog";
import { EmptyState } from "@/features/groups/components/empty-state";
import { ExpenseCard } from "@/features/groups/components/expense-card";
import { GroupActionsMenu } from "@/features/groups/components/group-actions-menu";
import { GroupActivityCard } from "@/features/groups/components/group-activity-card";
import {
  GroupDetailTabs,
  type GroupDetailTab,
} from "@/features/groups/components/group-detail-tabs";
import { GroupHeader } from "@/features/groups/components/group-header";
import { GroupsBackHeader } from "@/features/groups/components/groups-back-header";
import { GroupDetailSkeleton } from "@/features/groups/components/groups-skeleton";
import { MemberCard } from "@/features/groups/components/member-card";
import { useGroupBalances } from "@/features/balances/hooks/use-balances";
import { useExpenses } from "@/features/expenses/hooks/use-expenses";
import { useActivityFeed } from "@/features/activity/hooks/use-activity";
import { mapActivityToGroupActivity } from "@/features/activity/utils/map-activity";
import { mapExpenseToGroupExpense } from "@/features/expenses/utils/map-expense";
import { AddMemberByNameForm } from "@/features/groups/components/add-member-by-name-form";
import { InviteMembersButton } from "@/features/invitations/components/invite-members-button";
import { GroupPendingInvitationsSection } from "@/features/invitations/components/group-pending-invitations-section";
import {
  useAddGuestByName,
  useDeleteGroup,
  useGroup,
  useLeaveGroup,
} from "@/features/groups/hooks/use-groups";
import { getGroupsErrorMessage } from "@/features/groups/services/groups.errors";
import { LIST_STACK_CLASS, PageStack } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { GroupChatTab } from "@/features/chat/components/group-chat-tab";
import { GroupSettlementsPanel } from "@/features/settlements/components/group-settlements-panel";

interface GroupDetailPageContentProps {
  groupId: string;
}

export function GroupDetailPageContent({ groupId }: GroupDetailPageContentProps) {
  const router = useRouter();
  const { data: group, isLoading, isError, errorMessage, isSessionError, refetch } =
    useGroup(groupId);
  const { data: groupExpenses, isLoading: expensesLoading } = useExpenses(groupId);
  const { data: groupActivities, isLoading: activitiesLoading } = useActivityFeed({
    groupId,
  });
  const {
    balanceSummary,
    memberBalances,
    isLoading: balancesLoading,
    isError: balancesError,
    errorMessage: balancesErrorMessage,
    refetch: refetchBalances,
  } = useGroupBalances(groupId);
  const deleteGroup = useDeleteGroup();
  const leaveGroup = useLeaveGroup();
  const addGuest = useAddGuestByName(groupId);
  const [activeTab, setActiveTab] = useState<GroupDetailTab>("expenses");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  useEffect(() => {
    if (isSessionError) {
      router.replace(ROUTES.login);
    }
  }, [isSessionError, router]);

  const isOwner = group?.currentUserRole === "owner";
  const isAdmin = group?.currentUserRole === "admin";
  const canManageInvites = isOwner || isAdmin;

  function handleDelete() {
    deleteGroup.mutate(groupId, {
      onSuccess: () => {
        toast.success(`"${group?.name}" deleted`);
        router.push(ROUTES.groups);
      },
      onError: (error) => toast.error(getGroupsErrorMessage(error)),
    });
  }

  function handleLeave() {
    leaveGroup.mutate(groupId, {
      onSuccess: () => {
        toast.success(`You left "${group?.name}"`);
        router.push(ROUTES.groups);
      },
      onError: (error) => toast.error(getGroupsErrorMessage(error)),
    });
  }

  function handleAddGuest(name: string) {
    addGuest.mutate(name, {
      onSuccess: () => toast.success(`"${name}" added to the group`),
      onError: (error) => toast.error(getGroupsErrorMessage(error)),
    });
  }

  if (isLoading || !group) {
    return (
      <DashboardShell>
        <GroupsBackHeader title="Group" backHref={ROUTES.groups} backLabel="Back to groups" />
        {isError ? (
          <DashboardErrorState
            message={errorMessage ?? "Failed to load group."}
            onRetry={() => refetch()}
          />
        ) : (
          <GroupDetailSkeleton />
        )}
      </DashboardShell>
    );
  }

  const mappedExpenses = groupExpenses.map(mapExpenseToGroupExpense);
  const membersWithBalances = group.members.map((member) => ({
    ...member,
    balance: memberBalances[member.id] ?? 0,
  }));
  const settleableBalanceCount = Object.values(memberBalances).filter(
    (amount) => Math.abs(amount) >= 0.01,
  ).length;

  return (
    <DashboardShell>
      <PageStack>
        <GroupsBackHeader
          title={group.name}
          backHref={ROUTES.groups}
          backLabel="Back to groups"
          action={
            <GroupActionsMenu
              groupId={group.id}
              isOwner={isOwner}
              onDeleteClick={() => setDeleteOpen(true)}
              onLeaveClick={() => setLeaveOpen(true)}
            />
          }
        />

        <GroupHeader group={group} />
        <BalanceSummary balances={balanceSummary} />
        {balancesError && (
          <DashboardErrorState
            message={balancesErrorMessage ?? "Unable to load group balances."}
            onRetry={() => refetchBalances()}
          />
        )}

        {canManageInvites && (
          <GroupPendingInvitationsSection
            groupId={group.id}
            groupName={group.name}
            groupIcon={group.icon}
            isOwnerOrAdmin={canManageInvites}
          />
        )}

        <div className="flex flex-wrap gap-3">
          {canManageInvites && (
            <InviteMembersButton
              groupId={group.id}
              groupName={group.name}
              groupIcon={group.icon}
            />
          )}
          {settleableBalanceCount > 0 && (
            <Button
              type="button"
              variant="outline"
              className="h-11 min-w-[9rem] flex-1 gap-2"
              onClick={() => setActiveTab("balances")}
            >
              <HandCoins className="size-4" aria-hidden="true" />
              Settle up
            </Button>
          )}
          <Button
            render={<Link href={expenseNewRoute(group.id)} />}
            className="h-11 min-w-[9rem] flex-1 gap-2"
          >
            <Receipt className="size-4" aria-hidden="true" />
            Add expense
          </Button>
        </div>

        <GroupDetailTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          expenseCount={mappedExpenses.length}
          balanceCount={settleableBalanceCount}
          memberCount={group.members.length}
          activityCount={groupActivities.length}
        />

        <div
          role="tabpanel"
          id={`group-panel-${activeTab}`}
          aria-labelledby={`group-tab-${activeTab}`}
        >
          {activeTab === "expenses" &&
            (expensesLoading ? (
              <ul className={LIST_STACK_CLASS}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <li key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
                ))}
              </ul>
            ) : mappedExpenses.length === 0 ? (
              <EmptyState
                title="No expenses yet"
                description="Add your first expense to start splitting costs in this group."
                actionLabel="Add expense"
                actionHref={expenseNewRoute(group.id)}
                icon={<Receipt className="size-6 text-primary" aria-hidden="true" />}
              />
            ) : (
              <ul className={LIST_STACK_CLASS}>
                {mappedExpenses.map((expense) => (
                  <li key={expense.id}>
                    <ExpenseCard expense={expense} />
                  </li>
                ))}
              </ul>
            ))}

          {activeTab === "members" && (
            <div className="flex flex-col gap-4">
              <AddMemberByNameForm
                compact
                onSubmit={handleAddGuest}
                isSubmitting={addGuest.isPending}
              />

              {balancesLoading ? (
                <ul className={LIST_STACK_CLASS}>
                  {Array.from({ length: group.members.length || 3 }).map((_, index) => (
                    <li key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
                  ))}
                </ul>
              ) : (
                <ul className={LIST_STACK_CLASS}>
                  {membersWithBalances.map((member) => (
                    <li key={member.id}>
                      <MemberCard member={member} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === "balances" && <GroupSettlementsPanel groupId={group.id} />}

          {activeTab === "activity" &&
            (activitiesLoading ? (
              <ul className={LIST_STACK_CLASS}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <li key={index} className="h-16 animate-pulse rounded-xl bg-muted" />
                ))}
              </ul>
            ) : groupActivities.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Expenses and settlements in this group will show up here."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm min-[375px]:rounded-2xl">
                {groupActivities.map((activity, index) => (
                  <GroupActivityCard
                    key={activity.id}
                    activity={mapActivityToGroupActivity(activity)}
                    isLast={index === groupActivities.length - 1}
                  />
                ))}
              </div>
            ))}

          {activeTab === "chat" && (
            <GroupChatTab
              groupId={group.id}
              groupName={group.name}
              groupIcon={group.icon}
              memberCount={group.members.length}
            />
          )}
        </div>
      </PageStack>

      {isOwner && (
        <ConfirmationDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete group?"
          description={`This will permanently remove "${group.name}" and all its expenses. This action cannot be undone.`}
          confirmLabel="Delete group"
          variant="destructive"
          onConfirm={handleDelete}
        />
      )}

      {!isOwner && (
        <ConfirmationDialog
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          title="Leave group?"
          description={`You will no longer see expenses or balances for "${group.name}". You can rejoin with an invite link.`}
          confirmLabel="Leave group"
          variant="destructive"
          onConfirm={handleLeave}
        />
      )}
    </DashboardShell>
  );
}
