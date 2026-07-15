import type { LucideIcon } from "lucide-react";
import { LandingCardBase } from "@/features/landing/components/landing-card-base";
import { cn } from "@/lib/utils";

export interface StepCardProps {
  step: number;
  title: string;
  description: string;
  duration: string;
  icon: LucideIcon;
  /** Hides the desktop arrow connector on the final step. */
  isLast?: boolean;
}

/** Single step in the "How it works" timeline grid. */
export function StepCard({
  step,
  title,
  description,
  duration,
  icon: Icon,
  isLast = false,
}: StepCardProps) {
  return (
    <LandingCardBase
      className={cn(
        "min-h-[240px] flex-col sm:min-h-[260px]",
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -bottom-8 size-28 rounded-full bg-primary/15 opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-80"
        aria-hidden="true"
      />

      <div className="mb-4 flex shrink-0 items-center justify-between">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
          {step}
        </div>
        <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent-foreground uppercase">
          {duration}
        </span>
      </div>

      <div className="mb-3 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/10">
        <Icon className="size-4 text-primary" aria-hidden="true" />
      </div>

      <h3 className="font-heading mb-2 min-h-[2.75rem] text-base leading-snug font-semibold line-clamp-2">
        {title}
      </h3>
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-4">
        {description}
      </p>

      {!isLast && (
        <div
          className="absolute top-1/2 -right-3 hidden size-6 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-xs text-muted-foreground shadow-sm transition-transform duration-300 group-hover:translate-x-0.5 lg:flex"
          aria-hidden="true"
        >
          →
        </div>
      )}
    </LandingCardBase>
  );
}
