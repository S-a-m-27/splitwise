"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useCreateSettlement } from "@/features/settlements/hooks/use-settlements";
import { getSettlementsErrorMessage } from "@/features/settlements/services/settlements.errors";
import type { OutstandingDebt } from "@/features/settlements/types";

interface UseSettlementFlowOptions {
  onSuccess?: () => void;
}

export function useSettlementFlow(options: UseSettlementFlowOptions = {}) {
  const {
    mutate: createSettlement,
    reset: resetSettlement,
    isPending,
    error: settlementError,
  } = useCreateSettlement();
  const onSuccess = options.onSuccess;
  const clientSettlementId = useRef<string | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<OutstandingDebt | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reportDebt, setReportDebt] = useState<OutstandingDebt | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const openSettlement = useCallback(
    (debt: OutstandingDebt) => {
      resetSettlement();
      clientSettlementId.current = crypto.randomUUID();
      setSelectedDebt(debt);
      setDialogOpen(true);
    },
    [resetSettlement],
  );

  const changeDialogOpen = useCallback(
    (open: boolean) => {
      if (!open && isPending) return;
      setDialogOpen(open);
      if (!open) {
        setSelectedDebt(null);
        clientSettlementId.current = null;
      }
    },
    [isPending],
  );

  const openReport = useCallback((debt: OutstandingDebt) => {
    setReportDebt(debt);
    setReportOpen(true);
  }, []);

  const changeReportOpen = useCallback((open: boolean) => {
    setReportOpen(open);
    if (!open) setReportDebt(null);
  }, []);

  const submitSettlement = useCallback(
    (amount: number, notes: string) => {
      if (!selectedDebt || isPending) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        toast.error("You appear to be offline. Reconnect and try again.");
        return;
      }

      const retryKey = clientSettlementId.current ?? crypto.randomUUID();
      clientSettlementId.current = retryKey;
      createSettlement(
        {
          groupId: selectedDebt.groupId,
          fromUserId: selectedDebt.fromUserId,
          toUserId: selectedDebt.toUserId,
          amount,
          notes: notes || undefined,
          clientSettlementId: retryKey,
        },
        {
          onSuccess: () => {
            toast.success("Settlement recorded", {
              description: "Balances and activity have been updated.",
            });
            setDialogOpen(false);
            setSelectedDebt(null);
            clientSettlementId.current = null;
            onSuccess?.();
          },
          onError: (error) => toast.error(getSettlementsErrorMessage(error)),
        },
      );
    },
    [createSettlement, isPending, onSuccess, selectedDebt],
  );

  return {
    selectedDebt,
    dialogOpen,
    reportDebt,
    reportOpen,
    isSubmitting: isPending,
    submissionError: settlementError
      ? getSettlementsErrorMessage(settlementError)
      : null,
    openSettlement,
    changeDialogOpen,
    openReport,
    changeReportOpen,
    submitSettlement,
  };
}
