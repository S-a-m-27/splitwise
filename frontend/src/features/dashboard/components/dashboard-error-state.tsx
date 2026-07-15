"use client";

import { Button } from "@/components/ui/button";

interface DashboardErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/** Section-level error with optional retry. */
export function DashboardErrorState({ message, onRetry }: DashboardErrorStateProps) {
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-6 text-center min-[375px]:rounded-2xl">
      <p className="text-sm font-medium text-destructive">{message}</p>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onRetry}
        >
          Try again
        </Button>
      )}
    </div>
  );
}
