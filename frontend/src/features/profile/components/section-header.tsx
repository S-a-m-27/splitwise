import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  id?: string;
  title: string;
  description?: string;
  className?: string;
}

/** Profile section heading with optional supporting text. */
export function SectionHeader({ id, title, description, className }: SectionHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <span
          className="h-4 w-0.5 shrink-0 rounded-full bg-primary"
          aria-hidden="true"
        />
        <h2
          id={id}
          className="font-heading text-sm font-bold text-foreground min-[375px]:text-base"
        >
          {title}
        </h2>
      </div>
      {description && <p className={cn("pl-2.5 leading-relaxed", META_TEXT_CLASS)}>{description}</p>}
    </header>
  );
}
