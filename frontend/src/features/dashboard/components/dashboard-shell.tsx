import type { ReactNode } from "react";
import { MOBILE_COLUMN_CLASS } from "@/features/dashboard/constants/layout";
import { DashboardNavigation } from "@/features/dashboard/components/dashboard-navigation";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: ReactNode;
}

/** Server shell — navigation is the only hydrated dashboard chrome on mobile. */
export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="relative flex min-h-dvh overflow-x-hidden bg-background">
      <DashboardNavigation />

      <div className="relative flex min-w-0 flex-1 flex-col">
        <main
          className={cn(
            MOBILE_COLUMN_CLASS,
            "safe-area-top-inset flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))]",
            "xl:mx-0 xl:max-w-none xl:px-8 xl:pb-10 xl:pt-8",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
