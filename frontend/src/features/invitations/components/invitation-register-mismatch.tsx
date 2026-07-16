"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, LogOut } from "lucide-react";
import { buildInvitationRegisterUrl } from "@/lib/invitation-register";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { AUTH_SUBMIT_CLASS } from "@/features/auth/utils/form-styles";

interface InvitationRegisterMismatchProps {
  currentEmail: string;
  invitedEmail: string;
  redirectPath: string;
}

/**
 * Shown when a signed-in user opens an invitation "Create Account" link
 * meant for a different email address.
 */
export function InvitationRegisterMismatch({
  currentEmail,
  invitedEmail,
  redirectPath,
}: InvitationRegisterMismatchProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOutAndContinue = async () => {
    setIsSigningOut(true);
    try {
      const result = await authService.signOut();
      if (result.error) {
        setIsSigningOut(false);
        return;
      }

      useAuthStore.getState().clearAuth();
      queryClient.clear();
      router.push(buildInvitationRegisterUrl(invitedEmail, redirectPath));
    } catch {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        role="alert"
        className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
      >
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
        <div className="space-y-1">
          <p className="font-medium">You&apos;re signed in as a different account</p>
          <p className="text-muted-foreground">
            This invitation was sent to <span className="font-medium text-foreground">{invitedEmail}</span>,
            but you&apos;re currently signed in as <span className="font-medium text-foreground">{currentEmail}</span>.
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Sign out to create an account with the invited email address and accept the invitation.
      </p>

      <button
        type="button"
        onClick={() => void handleSignOutAndContinue()}
        disabled={isSigningOut}
        className={AUTH_SUBMIT_CLASS}
      >
        {isSigningOut ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Signing out…
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out and create account
          </>
        )}
      </button>
    </div>
  );
}
