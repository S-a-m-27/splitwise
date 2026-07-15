import type { ReactNode } from "react";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface DashboardSectionPanelProps {
  children: ReactNode;
  className?: string;
  /** Stretch panel to fill grid column height on wide layouts. */
  fill?: boolean;
}

/** Shared section container — keeps Groups and Activity visually aligned. */
export function DashboardSectionPanel({
  children,
  className,
  fill = false,
}: DashboardSectionPanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm min-[375px]:rounded-2xl",
        fill && "flex min-h-[8.5rem] flex-col xl:min-h-[10rem]",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface DashboardSectionEmptyProps {
  title: string;
  description: string;
}

/** Empty state inside a section panel — no nested dashed box. */
export function DashboardSectionEmpty({ title, description }: DashboardSectionEmptyProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5 py-10 text-center min-[375px]:px-6 min-[375px]:py-12">
      <p className="font-heading text-sm font-semibold text-foreground">{title}</p>
      <p className={cn("mt-2 max-w-xs leading-relaxed", META_TEXT_CLASS)}>{description}</p>
    </div>
  );
}
