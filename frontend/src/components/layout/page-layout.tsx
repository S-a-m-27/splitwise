import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

/** Vertical rhythm between major page blocks. */
export const PAGE_STACK_CLASS =
  "flex flex-col gap-5 min-[375px]:gap-6 md:gap-7";

/** Page title block spacing. */
export const PAGE_HEADER_CLASS = "flex flex-col gap-2";

export const PAGE_TITLE_CLASS =
  "font-heading text-xl font-bold leading-tight text-foreground min-[375px]:text-2xl";

/** Section block: heading + content. */
export const SECTION_STACK_CLASS =
  "flex flex-col gap-4 min-[375px]:gap-5";

/** Vertical list of cards/rows. */
export const LIST_STACK_CLASS =
  "flex flex-col gap-3 min-[375px]:gap-3.5";

/** Standard inset for rows inside section panels. */
export const PANEL_ROW_CLASS =
  "px-3 py-3 min-[375px]:px-4 min-[375px]:py-3.5";

interface PageStackProps {
  children: ReactNode;
  className?: string;
}

export function PageStack({ children, className }: PageStackProps) {
  return <div className={cn(PAGE_STACK_CLASS, className)}>{children}</div>;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={cn(PAGE_HEADER_CLASS, className)}>
      <h1 className={PAGE_TITLE_CLASS}>{title}</h1>
      {description && <p className={META_TEXT_CLASS}>{description}</p>}
    </header>
  );
}

interface BackHeaderProps {
  title: string;
  backHref: string;
  backLabel?: string;
  action?: ReactNode;
  className?: string;
}

/** Consistent back navigation header for sub-pages. */
export function BackHeader({
  title,
  backHref,
  backLabel = "Back",
  action,
  className,
}: BackHeaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-11 items-center justify-between gap-3",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <Link
          href={backHref}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground",
            "transition-colors hover:bg-muted hover:text-foreground active:bg-muted/80",
            "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          )}
          aria-label={backLabel}
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <h1 className="truncate font-heading text-lg font-bold leading-tight text-foreground min-[375px]:text-xl">
          {title}
        </h1>
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
