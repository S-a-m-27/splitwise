import { cn } from "@/lib/utils";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "space-y-3",
        align === "center" && "text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-gradient-primary text-[11px] font-bold tracking-[0.2em] uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="font-heading text-xl font-bold tracking-tight text-balance sm:text-2xl lg:text-3xl">
        <span className="text-gradient">{title}</span>
      </h2>
      {description && (
        <p
          className={cn(
            "text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base",
            align === "center" && "mx-auto max-w-2xl",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
