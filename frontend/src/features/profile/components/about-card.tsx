import { Sparkles } from "lucide-react";
import type { AppAboutInfo } from "@/features/profile/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface AboutCardProps {
  about: AppAboutInfo;
  className?: string;
}

/** App identity and version summary card. */
export function AboutCard({ about, className }: AboutCardProps) {
  return (
    <section
      aria-labelledby="about-app-heading"
      className={cn(
        "overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-md",
        className,
      )}
    >
      <div className="bg-gradient-to-br from-primary/12 via-violet-500/8 to-transparent px-5 py-6 min-[375px]:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-xl shadow-lg shadow-primary/25">
            <Sparkles className="size-6 text-primary-foreground" aria-hidden="true" />
          </span>
          <div>
            <h2
              id="about-app-heading"
              className="font-heading text-xl font-bold text-foreground min-[375px]:text-2xl"
            >
              {about.appName}
            </h2>
            <p className={cn("mt-0.5", META_TEXT_CLASS)}>{about.description}</p>
          </div>
        </div>
      </div>

      <dl className="divide-y divide-border/60 px-5 py-1 min-[375px]:px-6">
        <div className="flex items-center justify-between gap-4 py-3.5">
          <dt className="text-sm font-medium text-foreground/80">App version</dt>
          <dd className="font-heading text-sm font-bold tabular-nums text-foreground">
            v{about.appVersion}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4 py-3.5">
          <dt className="text-sm font-medium text-foreground/80">Build</dt>
          <dd className="font-heading text-sm font-bold tabular-nums text-foreground">
            {about.buildVersion}
          </dd>
        </div>
      </dl>
    </section>
  );
}
