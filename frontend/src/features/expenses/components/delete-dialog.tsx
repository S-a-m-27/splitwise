"use client";

import { ConfirmationDialog } from "@/features/groups/components/confirmation-dialog";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expenseTitle: string;
  onConfirm: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  expenseTitle,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete expense?"
      description={`"${expenseTitle}" will be permanently removed from this group. This action cannot be undone.`}
      confirmLabel="Delete expense"
      cancelLabel="Keep expense"
      onConfirm={onConfirm}
      variant="destructive"
    />
  );
}
