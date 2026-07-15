"use client";

import { Crown, Shield, UserRound } from "lucide-react";
import type { GroupMember } from "@/features/groups/types";
import { UserAvatar } from "@/features/dashboard/components/user-avatar";
import { useCurrency } from "@/hooks/use-currency";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface MemberCardProps {
  member: GroupMember;
  className?: string;
}

function MemberRoleBadge({ member }: { member: GroupMember }) {
  if (member.isGuest) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border border-border/80",
          "bg-muted/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground",
        )}
      >
        <UserRound className="size-3" aria-hidden="true" />
        Guest
      </span>
    );
  }

  if (member.role === "owner") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/35",
          "bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-primary/10",
          "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
          "text-amber-700 shadow-sm dark:text-amber-300",
        )}
      >
        <Crown className="size-3" aria-hidden="true" />
        Owner
      </span>
    );
  }

  if (member.role === "admin") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/25",
          "bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary",
        )}
      >
        <Shield className="size-3" aria-hidden="true" />
        Admin
      </span>
    );
  }

  return null;
}

export function MemberCard({ member, className }: MemberCardProps) {
  const { formatCurrency } = useCurrency();
  const isOwed = member.balance >= 0;
  const balanceLabel =
    member.balance === 0
      ? "settled up"
      : isOwed
        ? `owes you ${formatCurrency(member.balance)}`
        : `you owe ${formatCurrency(Math.abs(member.balance))}`;

  return (
    <article
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl border border-border/80 bg-card px-3 py-2.5 shadow-sm",
        "min-[375px]:px-3.5 min-[375px]:py-3",
        member.isCurrentUser && "border-primary/20 bg-primary/5",
        member.role === "owner" && "border-amber-500/20 bg-amber-500/[0.04]",
        className,
      )}
    >
      <UserAvatar
        name={member.name}
        avatarUrl={member.avatarUrl}
        initials={member.initials}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <MemberRoleBadge member={member} />
          <p className="min-w-0 truncate text-sm font-semibold text-foreground">
            {member.name}
            {member.isCurrentUser && (
              <span className={cn("ml-1.5 font-medium", META_TEXT_CLASS)}>(you)</span>
            )}
          </p>
        </div>
        <p
          className={cn(
            "mt-1 truncate text-xs font-medium min-[375px]:text-[13px]",
            member.balance === 0
              ? "text-foreground/65"
              : isOwed
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-destructive",
          )}
        >
          {balanceLabel}
        </p>
      </div>
    </article>
  );
}
