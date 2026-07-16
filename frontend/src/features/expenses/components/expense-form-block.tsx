import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ExpenseFormBlockProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Light section chrome for the expense form — title + optional hint, no card shell.
 */
export function ExpenseFormBlock({
  title,
  description,
  children,
  className,
}: ExpenseFormBlockProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
