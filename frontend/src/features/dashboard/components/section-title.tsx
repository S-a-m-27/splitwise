import Link from "next/link";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface SectionTitleProps {
  id?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

/** Compact section label for narrow mobile screens. */
export function SectionTitle({
  id,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-0.5 shrink-0 rounded-full bg-primary"
            aria-hidden="true"
          />
          <h2
            id={id}
            className="font-heading text-sm font-bold leading-tight text-foreground md:text-base"
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className={cn("mt-1.5 pl-2.5 leading-relaxed", META_TEXT_CLASS)}>{subtitle}</p>
        )}
      </div>

      {actionLabel &&
        (actionHref ? (
          <Link
            href={actionHref}
            className="shrink-0 text-xs font-semibold text-primary active:opacity-70 min-[375px]:text-[13px]"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 text-xs font-semibold text-primary active:opacity-70 min-[375px]:text-[13px]"
          >
            {actionLabel}
          </button>
        ))}
    </div>
  );
}
