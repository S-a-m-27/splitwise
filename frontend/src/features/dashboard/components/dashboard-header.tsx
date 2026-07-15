import type { DashboardUser } from "@/features/dashboard/types";
import { MOBILE_BLEED_X_CLASS } from "@/features/dashboard/constants/layout";
import { NotificationButton } from "@/features/dashboard/components/notification-button";
import { UserAvatar } from "@/features/dashboard/components/user-avatar";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  user: DashboardUser;
  className?: string;
}

/** Dashboard header with authenticated user greeting and avatar. */
export function DashboardHeader({ user, className }: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-20 mb-4 border-b border-border/50 bg-background py-3",
        MOBILE_BLEED_X_CLASS,
        "xl:static xl:mx-0 xl:mb-5 xl:border-0 xl:px-0 xl:py-0",
        className,
      )}
    >
      <div className="flex items-center gap-2 min-[375px]:gap-2.5">
        <UserAvatar
          name={user.name}
          avatarUrl={user.avatarUrl}
          initials={user.initials}
        />

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-sm font-bold leading-tight text-foreground min-[375px]:text-base">
            <span className={META_TEXT_CLASS}>{user.greeting}, </span>
            {user.name}
          </h1>
        </div>

        <NotificationButton />
      </div>
    </header>
  );
}
