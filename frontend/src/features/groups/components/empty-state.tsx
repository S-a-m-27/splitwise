import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-5 py-10 text-center",
        "min-[375px]:min-h-[16rem] min-[375px]:rounded-2xl min-[375px]:px-6 min-[375px]:py-12",
        className,
      )}
    >
      {icon && (
        <div
          className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-2xl min-[375px]:mb-4 min-[375px]:size-14 min-[375px]:rounded-2xl"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3 className="font-heading text-base font-bold text-foreground min-[375px]:text-lg">
        {title}
      </h3>
      <p className={cn("mt-2.5 max-w-xs leading-relaxed", META_TEXT_CLASS)}>{description}</p>

      {actionLabel &&
        (actionHref ? (
          <Button
            render={<Link href={actionHref} />}
            className="mt-5 h-11 min-w-[10rem] px-4"
          >
            {actionLabel}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onAction}
            className="mt-5 h-11 min-w-[10rem] px-4"
          >
            {actionLabel}
          </Button>
        ))}
    </div>
  );
}
