import { Users } from "lucide-react";
import type { GroupDetail } from "@/features/groups/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface GroupHeaderProps {
  group: Pick<GroupDetail, "name" | "icon" | "memberCount" | "description">;
  className?: string;
}

export function GroupHeader({ group, className }: GroupHeaderProps) {
  return (
    <header className={cn("flex items-start gap-3 min-[375px]:gap-4", className)}>
      <span
        className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted text-2xl shadow-sm min-[375px]:size-16 min-[375px]:text-3xl"
        aria-hidden="true"
      >
        {group.icon}
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        <h1 className="font-heading text-xl font-bold leading-tight text-foreground min-[375px]:text-2xl">
          {group.name}
        </h1>
        <p className={cn("mt-1 flex items-center gap-1.5", META_TEXT_CLASS)}>
          <Users className="size-3.5 shrink-0 text-foreground/50" aria-hidden="true" />
          {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
        </p>
        {group.description && (
          <p className={cn("mt-1.5 line-clamp-2", META_TEXT_CLASS)}>
            {group.description}
          </p>
        )}
      </div>
    </header>
  );
}
