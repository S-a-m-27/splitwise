import { cn } from "@/lib/utils";

interface GlowCardWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function GlowCardWrapper({
  children,
  className,
}: GlowCardWrapperProps) {
  return (
    <div className={cn("group/glow relative h-full", className)}>
      <div
        className="pointer-events-none absolute -top-6 -right-6 size-28 rounded-full bg-primary/25 opacity-50 blur-3xl transition-all duration-500 group-hover/glow:opacity-80 group-hover/glow:scale-110"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-6 -left-6 size-32 rounded-full bg-primary/15 opacity-40 blur-3xl transition-all duration-500 group-hover/glow:opacity-70 group-hover/glow:scale-105"
        aria-hidden="true"
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
