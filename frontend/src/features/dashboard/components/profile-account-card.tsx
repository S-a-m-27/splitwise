"use client";

import { LogoutButton } from "@/features/auth/components/logout-button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { UserAvatar } from "@/features/dashboard/components/user-avatar";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { DashboardHeaderSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import { mapAuthToDashboardUser } from "@/features/dashboard/utils/map-dashboard-user";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

/** Profile summary with authenticated user data and logout. */
export function ProfileAccountCard() {
  const { user, profile, isLoading } = useAuth();
  const dashboardUser = mapAuthToDashboardUser(profile, user);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 min-[375px]:rounded-2xl">
        <DashboardHeaderSkeleton />
      </div>
    );
  }

  if (!dashboardUser) {
    return (
      <DashboardErrorState message="We could not load your profile. Please sign in again." />
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm min-[375px]:rounded-2xl">
      <div className="flex items-center gap-3">
        <UserAvatar
          name={dashboardUser.name}
          avatarUrl={dashboardUser.avatarUrl}
          initials={dashboardUser.initials}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base font-bold">{dashboardUser.name}</p>
          {user?.email && (
            <p className={cn("truncate", META_TEXT_CLASS)}>{user.email}</p>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <LogoutButton variant="destructive" />
      </div>
    </div>
  );
}
