import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LandingCardBase } from "@/features/landing/components/landing-card-base";
import { cn } from "@/lib/utils";

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tag: string;
  highlight: string;
  className?: string;
}

/** Feature grid card with icon, tag badge, and highlight footer. */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  tag,
  highlight,
  className,
}: FeatureCardProps) {
  return (
    <LandingCardBase className={cn("min-h-[220px] flex-col", className)}>
      <div
        className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-primary/20 opacity-60 blur-2xl transition-all duration-500 group-hover:opacity-90 group-hover:scale-110"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 size-28 rounded-full bg-primary/10 opacity-50 blur-2xl transition-all duration-500 group-hover:opacity-75"
        aria-hidden="true"
      />

      <div className="relative mb-4 flex shrink-0 items-start justify-between gap-2">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/10 transition-all duration-300 group-hover:bg-primary/15 group-hover:ring-primary/20">
          <Icon
            className="size-5 text-primary transition-transform duration-300 group-hover:scale-110"
            aria-hidden="true"
          />
        </div>
        <Badge
          variant="secondary"
          className="shrink-0 text-[10px] font-semibold tracking-wide uppercase"
        >
          {tag}
        </Badge>
      </div>

      <h3 className="font-heading relative mb-2 min-h-[1.5rem] text-base font-semibold line-clamp-2">
        {title}
      </h3>
      <p className="relative mb-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
        {description}
      </p>

      <div className="relative mt-auto flex shrink-0 items-center gap-2 border-t border-border/60 pt-3">
        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
        <span className="text-xs font-medium text-primary">{highlight}</span>
      </div>
    </LandingCardBase>
  );
}
