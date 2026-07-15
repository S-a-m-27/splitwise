import type { LucideIcon } from "lucide-react";
import { LandingCardBase } from "@/features/landing/components/landing-card-base";

export interface BenefitCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  metric: string;
}

/** Horizontal benefit card for the "Why choose us" section. */
export function BenefitCard({
  icon: Icon,
  title,
  description,
  metric,
}: BenefitCardProps) {
  return (
    <LandingCardBase className="min-h-[140px] gap-4">
      <div
        className="pointer-events-none absolute -top-6 right-4 size-20 rounded-full bg-primary/20 opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
        aria-hidden="true"
      />

      <div
        className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-primary/60 to-primary/10 transition-all duration-300 group-hover:w-1.5"
        aria-hidden="true"
      />

      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10 transition-all duration-300 group-hover:bg-primary/15">
        <Icon
          className="size-5 text-primary transition-transform duration-300 group-hover:scale-110"
          aria-hidden="true"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1 flex shrink-0 items-center justify-between gap-2">
          <h3 className="font-heading text-base font-semibold">{title}</h3>
          <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            {metric}
          </span>
        </div>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {description}
        </p>
      </div>
    </LandingCardBase>
  );
}
