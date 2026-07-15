"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { LIST_STACK_CLASS, PageHeader, PageStack, SECTION_STACK_CLASS } from "@/components/layout/page-layout";
import { ActivityCard } from "@/features/dashboard/components/activity-card";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import {
  DashboardSectionEmpty,
  DashboardSectionPanel,
} from "@/features/dashboard/components/dashboard-section-panel";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ActivityFeedSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { SectionHeader } from "@/features/profile/components/section-header";
import { EmptyState } from "@/features/groups/components/empty-state";
import { DebtCard } from "@/features/settlements/components/debt-card";
import { SettlementFormDialog } from "@/features/settlements/components/settlement-form-dialog";
import {
  useCreateSettlement,
  useOutstandingDebts,
  useSettlements,
} from "@/features/settlements/hooks/use-settlements";
import { getSettlementsErrorMessage } from "@/features/settlements/services/settlements.errors";
import type { OutstandingDebt } from "@/features/settlements/types";
import { mapSettlementToActivityItem } from "@/features/activity/utils/map-activity";

export function SettlementsPageContent() {
  const {
    data: debts,
    isLoading: debtsLoading,
    isError: debtsError,
    errorMessage: debtsErrorMessage,
    refetch: refetchDebts,
    isEmpty: debtsEmpty,
  } = useOutstandingDebts();
  const {
    data: history,
    isLoading: historyLoading,
    isError: historyError,
    refetch: refetchHistory,
    isEmpty: historyEmpty,
  } = useSettlements();
  const createSettlement = useCreateSettlement();
  const [selectedDebt, setSelectedDebt] = useState<OutstandingDebt | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function openSettlement(debt: OutstandingDebt) {
    setSelectedDebt(debt);
    setDialogOpen(true);
  }

  function handleSettlementSubmit(amount: number, notes: string) {
    if (!selectedDebt) return;

    const fromUserId =
      selectedDebt.direction === "you_owe"
        ? selectedDebt.fromUserId
        : selectedDebt.fromUserId;
    const toUserId =
      selectedDebt.direction === "you_owe"
        ? selectedDebt.toUserId
        : selectedDebt.toUserId;

    createSettlement.mutate(
      {
        groupId: selectedDebt.groupId,
        fromUserId,
        toUserId,
        amount,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Settlement recorded");
          setDialogOpen(false);
          setSelectedDebt(null);
        },
        onError: (error) => toast.error(getSettlementsErrorMessage(error)),
      },
    );
  }

  const youOwe = debts.filter((d) => d.direction === "you_owe");
  const owedToYou = debts.filter((d) => d.direction === "owed_to_you");

  return (
    <DashboardShell>
      <PageStack>
        <PageHeader
          title="Settle up"
          description="Record payments to simplify balances across your groups."
        />

        <section aria-labelledby="outstanding-debts-heading" className={SECTION_STACK_CLASS}>
          <SectionHeader
            id="outstanding-debts-heading"
            title="Outstanding balances"
            description="Simplified debts from your real expense data."
          />

          {debtsLoading ? (
            <ul className={LIST_STACK_CLASS}>
              {Array.from({ length: 2 }).map((_, index) => (
                <li key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
              ))}
            </ul>
          ) : debtsError ? (
            <DashboardErrorState
              message={debtsErrorMessage ?? "Failed to load balances."}
              onRetry={() => refetchDebts()}
            />
          ) : debtsEmpty ? (
            <EmptyState
              title="All settled up"
              description="You have no outstanding balances. Add expenses to track who owes what."
              icon={<CheckCircle2 className="size-6 text-emerald-600" aria-hidden="true" />}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {youOwe.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-destructive">
                    You owe
                  </h3>
                  {youOwe.map((debt) => (
                    <DebtCard key={debt.id} debt={debt} onSettle={openSettlement} />
                  ))}
                </div>
              )}

              {owedToYou.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                    Owed to you
                  </h3>
                  {owedToYou.map((debt) => (
                    <DebtCard key={debt.id} debt={debt} onSettle={openSettlement} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="settlement-history-heading" className={SECTION_STACK_CLASS}>
          <SectionHeader
            id="settlement-history-heading"
            title="Settlement history"
            description="Previously recorded payments."
          />

          <DashboardSectionPanel>
            {historyLoading ? (
              <div className="p-3 min-[375px]:p-4">
                <ActivityFeedSkeleton />
              </div>
            ) : historyError ? (
              <div className="p-4">
                <DashboardErrorState
                  message="Failed to load settlement history."
                  onRetry={() => refetchHistory()}
                />
              </div>
            ) : historyEmpty ? (
              <DashboardSectionEmpty
                title="No settlements yet"
                description="When you record a payment, it will appear here."
              />
            ) : (
              <div>
                {history.map((item, index) => {
                  const activity = mapSettlementToActivityItem(item);
                  return (
                    <ActivityCard
                      key={item.id}
                      activity={activity}
                      isLast={index === history.length - 1}
                    />
                  );
                })}
              </div>
            )}
          </DashboardSectionPanel>
        </section>
      </PageStack>

      <SettlementFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        debt={selectedDebt}
        onSubmit={handleSettlementSubmit}
        isSubmitting={createSettlement.isPending}
      />
    </DashboardShell>
  );
}
