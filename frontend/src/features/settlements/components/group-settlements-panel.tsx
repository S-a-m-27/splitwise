"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SECTION_STACK_CLASS } from "@/components/layout/page-layout";
import { ROUTES } from "@/constants/routes";
import { SectionHeader } from "@/features/profile/components/section-header";
import { DebtBreakdownSheet } from "@/features/settlements/components/debt-breakdown-sheet";
import { OutstandingDebtsPanel } from "@/features/settlements/components/outstanding-debts-panel";
import { SettlementFormDialog } from "@/features/settlements/components/settlement-form-dialog";
import { SettlementHistoryPanel } from "@/features/settlements/components/settlement-history-panel";
import { useSettlementFlow } from "@/features/settlements/hooks/use-settlement-flow";
import {
  useOutstandingDebts,
  useSettlements,
} from "@/features/settlements/hooks/use-settlements";
import { filterOutstandingDebtsByGroup } from "@/features/settlements/utils/filter-outstanding-debts";

interface GroupSettlementsPanelProps {
  groupId: string;
}

export function GroupSettlementsPanel({ groupId }: GroupSettlementsPanelProps) {
  const router = useRouter();
  const debtsQuery = useOutstandingDebts();
  const historyQuery = useSettlements(groupId);
  const flow = useSettlementFlow();
  const groupDebts = useMemo(
    () => filterOutstandingDebtsByGroup(debtsQuery.data, groupId),
    [debtsQuery.data, groupId],
  );

  useEffect(() => {
    if (debtsQuery.isSessionError || historyQuery.isSessionError) {
      router.replace(ROUTES.login);
    }
  }, [debtsQuery.isSessionError, historyQuery.isSessionError, router]);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="group-outstanding-heading" className={SECTION_STACK_CLASS}>
        <SectionHeader
          id="group-outstanding-heading"
          title="Outstanding balances"
          description="Select a person to settle an amount in this group."
        />
        <OutstandingDebtsPanel
          debts={groupDebts}
          isLoading={debtsQuery.isLoading}
          isError={debtsQuery.isError}
          errorMessage={debtsQuery.errorMessage}
          onRetry={() => void debtsQuery.refetch()}
          onSettle={flow.openSettlement}
          onViewReport={flow.openReport}
          emptyTitle="Nothing to settle"
          emptyDescription="Everyone in this group is settled up."
        />
      </section>

      <section aria-labelledby="group-settlement-history-heading" className={SECTION_STACK_CLASS}>
        <SectionHeader
          id="group-settlement-history-heading"
          title="Settlement history"
          description="Payments previously recorded in this group."
        />
        <SettlementHistoryPanel
          history={historyQuery.data}
          isLoading={historyQuery.isLoading}
          isError={historyQuery.isError}
          errorMessage={historyQuery.errorMessage}
          onRetry={() => void historyQuery.refetch()}
          emptyDescription="Recorded payments for this group will appear here."
        />
      </section>

      <DebtBreakdownSheet
        debt={flow.reportDebt}
        open={flow.reportOpen}
        onOpenChange={flow.changeReportOpen}
      />
      <SettlementFormDialog
        open={flow.dialogOpen}
        onOpenChange={flow.changeDialogOpen}
        debt={flow.selectedDebt}
        onSubmit={flow.submitSettlement}
        isSubmitting={flow.isSubmitting}
        submissionError={flow.submissionError}
      />
    </div>
  );
}
