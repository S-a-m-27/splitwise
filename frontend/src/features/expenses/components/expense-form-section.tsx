import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ExpenseFormSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "default" | "glow";
}

export function ExpenseFormSection({
  title,
  description,
  icon,
  children,
  className,
  variant = "default",
}: ExpenseFormSectionProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border p-4 shadow-sm min-[375px]:rounded-3xl min-[375px]:p-5",
        variant === "glow"
          ? "border-primary/25 bg-gradient-to-br from-primary/10 via-card to-violet-500/8"
          : "border-border/70 bg-card/90 backdrop-blur-sm",
        className,
      )}
    >
      <div className="mb-5 flex items-start gap-3 min-[375px]:mb-6">
        {icon && (
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary shadow-sm"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base font-bold text-foreground min-[375px]:text-lg">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
