"use client";

import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";

/** Official-style multicolor Google "G" mark for the sign-in button. */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3.01h3.88c2.27-2.09 3.54-5.17 3.54-8.88Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.32v3.1A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.31A7.2 7.2 0 0 1 4.92 12c0-.8.14-1.58.39-2.31V6.59H1.32A12 12 0 0 0 0 12c0 1.94.46 3.77 1.32 5.41l3.99-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.32 6.59l3.99 3.1C6.25 6.87 8.89 4.77 12 4.77Z"
      />
    </svg>
  );
}

interface GoogleSignInButtonProps {
  redirectTo?: string | null;
  disabled?: boolean;
  className?: string;
  label?: string;
}

/**
 * Reusable Google OAuth button. Starts Supabase redirect flow via authService.
 */
export function GoogleSignInButton({
  redirectTo = null,
  disabled = false,
  className,
  label = "Continue with Google",
}: GoogleSignInButtonProps) {
  const { signInWithGoogle, isSigningInWithGoogle } = useAuth();
  const isDisabled = disabled || isSigningInWithGoogle;

  return (
    <button
      type="button"
      onClick={() => signInWithGoogle({ redirectTo })}
      disabled={isDisabled}
      aria-label={label}
      aria-busy={isSigningInWithGoogle || undefined}
      className={cn(
        "group relative flex h-[50px] w-full items-center justify-center gap-3 overflow-hidden rounded-xl",
        "border border-border/80 bg-card text-[15px] font-semibold text-foreground shadow-sm",
        "transition-all duration-200 hover:bg-accent/50 hover:border-border",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
    >
      {isSigningInWithGoogle ? (
        <>
          <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
          <span>Connecting to Google…</span>
        </>
      ) : (
        <>
          <GoogleMark className="size-5 shrink-0" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
