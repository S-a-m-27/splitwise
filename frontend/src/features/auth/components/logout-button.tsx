"use client";

import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
  label?: string;
  /** Larger sidebar-style layout with icon badge */
  prominent?: boolean;
}

/** Signs the user out via Supabase and redirects to home. */
export function LogoutButton({
  className,
  variant = "outline",
  size = "default",
  showIcon = true,
  label = "Log out",
  prominent = false,
}: LogoutButtonProps) {
  const { logout, isLoggingOut } = useAuth();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => logout()}
      disabled={isLoggingOut}
      className={cn(
        "w-full",
        prominent && "h-12 gap-3 rounded-2xl px-4 text-[15px] font-semibold",
        className,
      )}
    >
      {isLoggingOut ? (
        prominent ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <Loader2 className="size-5 animate-spin text-destructive" aria-hidden="true" />
          </span>
        ) : (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        )
      ) : showIcon ? (
        prominent ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <LogOut className="size-[1.125rem]" aria-hidden="true" />
          </span>
        ) : (
          <LogOut className="size-4" aria-hidden="true" />
        )
      ) : null}
      {label}
    </Button>
  );
}
