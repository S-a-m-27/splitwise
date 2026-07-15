"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { MOBILE_FAB_RIGHT_CLASS } from "@/features/dashboard/constants/layout";
import { cn } from "@/lib/utils";

interface GroupsFabProps {
  className?: string;
}

export function GroupsFab({ className }: GroupsFabProps) {
  return (
    <div
      className={cn(
        "fixed z-40",
        MOBILE_FAB_RIGHT_CLASS,
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] xl:bottom-8",
        className,
      )}
    >
      <Link
        href={ROUTES.groupNew}
        aria-label="Create group"
        className={cn(
          "flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg min-[375px]:size-14",
          "transition-transform duration-150 active:scale-90 hover:scale-105",
          "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        )}
      >
        <Plus className="size-5 min-[375px]:size-6" strokeWidth={2.5} aria-hidden="true" />
      </Link>
    </div>
  );
}
