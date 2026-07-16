import { cn } from "@/lib/utils";

interface OnlineBadgeProps {
  className?: string;
  label?: string;
}

export function OnlineBadge({ className, label = "Online" }: OnlineBadgeProps) {
  return (
    <span
      className={cn(
        "block size-3 rounded-full border-2 border-card bg-emerald-500",
        "dark:bg-emerald-400",
        className,
      )}
      role="status"
      aria-label={label}
    />
  );
}
