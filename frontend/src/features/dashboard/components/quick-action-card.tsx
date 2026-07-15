"use client";

import Link from "next/link";
import { HandCoins, PlusCircle, Users } from "lucide-react";
import type { QuickAction } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  action: QuickAction;
  href: string;
  className?: string;
}

const ICONS = {
  group: Users,
  expense: PlusCircle,
  settle: HandCoins,
} as const;

const THEMES = {
  group: {
    gradient: "from-violet-500/12 to-card",
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    border: "border-violet-500/15 active:border-violet-500/35",
  },
  expense: {
    gradient: "from-primary/12 to-card",
    iconBg: "bg-primary/15 text-primary",
    border: "border-primary/15 active:border-primary/35",
  },
  settle: {
    gradient: "from-emerald-500/12 to-card",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/15 active:border-emerald-500/35",
  },
} as const;

export function QuickActionCard({ action, href, className }: QuickActionCardProps) {
  const Icon = ICONS[action.icon];
  const theme = THEMES[action.icon];

  return (
    <Link
      href={href}
      aria-label={action.label}
      className={cn(
        "flex min-h-[5rem] w-full min-w-0 flex-col items-center justify-center gap-2 rounded-xl border bg-gradient-to-b p-2.5 shadow-sm",
        "transition-transform active:scale-95 min-[375px]:min-h-[5.75rem] min-[375px]:gap-2.5 min-[375px]:p-3",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        theme.gradient,
        theme.border,
        className,
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-lg min-[375px]:size-10 min-[375px]:rounded-xl",
          theme.iconBg,
        )}
      >
        <Icon className="size-4 min-[375px]:size-5" aria-hidden="true" />
      </span>
      <span className="w-full truncate text-center text-xs font-bold leading-snug text-foreground min-[375px]:text-[13px]">
        <span className="min-[375px]:hidden">{action.shortLabel}</span>
        <span className="hidden min-[375px]:inline">{action.label}</span>
      </span>
    </Link>
  );
}
