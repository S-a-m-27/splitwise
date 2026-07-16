"use client";

import { cn } from "@/lib/utils";

interface InvitationBadgeProps {
  readonly count: number;
  readonly className?: string;
}

/** Unread invitation count badge for notification bell and nav items. */
export function InvitationBadge({ count, className }: InvitationBadgeProps) {
  if (count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={cn(
        "absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full",
        "bg-destructive px-1 py-0.5 text-[10px] font-bold leading-none text-white",
        "ring-2 ring-background animate-in fade-in zoom-in-75 duration-200",
        className,
      )}
      aria-label={`${count} unread invitation${count === 1 ? "" : "s"}`}
    >
      {label}
    </span>
  );
}
