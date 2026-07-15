"use client";

import { ConfirmationDialog } from "@/features/groups/components/confirmation-dialog";
import { useAuth } from "@/features/auth/hooks/use-auth";

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Confirmation dialog before signing out. */
export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  const { logout } = useAuth();

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Log out?"
      description="You will need to sign in again to access your groups and expenses."
      confirmLabel="Log out"
      variant="destructive"
      onConfirm={() => logout()}
    />
  );
}
