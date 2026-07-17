import { cn } from "@/lib/utils";

interface AuthDividerProps {
  label?: string;
  className?: string;
}

/** Visual separator between email auth and social providers. */
export function AuthDivider({
  label = "or continue with",
  className,
}: AuthDividerProps) {
  return (
    <div
      className={cn("flex items-center gap-3 py-1", className)}
      role="separator"
      aria-label={label}
    >
      <span className="h-px flex-1 bg-border/80" aria-hidden="true" />
      <span className="shrink-0 text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="h-px flex-1 bg-border/80" aria-hidden="true" />
    </div>
  );
}
