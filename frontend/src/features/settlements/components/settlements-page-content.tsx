"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, PageStack, SECTION_STACK_CLASS } from "@/components/layout/page-layout";
import { ROUTES } from "@/constants/routes";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { SectionHeader } from "@/features/profile/components/section-header";
import { DebtBreakdownSheet } from "@/features/settlements/components/debt-breakdown-sheet";
import { OutstandingDebtsPanel } from "@/features/settlements/components/outstanding-debts-panel";
import { SettlementFormDialog } from "@/features/settlements/components/settlement-form-dialog";
import { SettlementHistoryPanel } from "@/features/settlements/components/settlement-history-panel";
import {
  useOutstandingDebts,
  useSettlements,
} from "@/features/settlements/hooks/use-settlements";
import { useSettlementFlow } from "@/features/settlements/hooks/use-settlement-flow";

export function SettlementsPageContent() {
  const router = useRouter();
  const debtsQuery = useOutstandingDebts();
  const historyQuery = useSettlements();
  const flow = useSettlementFlow();

  useEffect(() => {
    if (debtsQuery.isSessionError || historyQuery.isSessionError) {
      router.replace(ROUTES.login);
    }
  }, [debtsQuery.isSessionError, historyQuery.isSessionError, router]);

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
            description="Simplified debts with expense and payment breakdowns."
          />

          <OutstandingDebtsPanel
            debts={debtsQuery.data}
            isLoading={debtsQuery.isLoading}
            isError={debtsQuery.isError}
            errorMessage={debtsQuery.errorMessage}
            onRetry={() => void debtsQuery.refetch()}
            onSettle={flow.openSettlement}
            onViewReport={flow.openReport}
            emptyDescription="You have no outstanding balances. Add expenses to track who owes what."
          />
        </section>

        <section aria-labelledby="settlement-history-heading" className={SECTION_STACK_CLASS}>
          <SectionHeader
            id="settlement-history-heading"
            title="Settlement history"
            description="Previously recorded payments."
          />

          <SettlementHistoryPanel
            history={historyQuery.data}
            isLoading={historyQuery.isLoading}
            isError={historyQuery.isError}
            errorMessage={historyQuery.errorMessage}
            onRetry={() => void historyQuery.refetch()}
          />
        </section>
      </PageStack>

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
    </DashboardShell>
  );
}
