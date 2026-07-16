import type { ConversationType } from "@/features/chat/types";
import { OnlineBadge } from "@/features/chat/components/online-badge";
import { cn } from "@/lib/utils";

interface ConversationAvatarProps {
  type: ConversationType;
  title: string;
  avatarIcon?: string;
  avatarUrl?: string;
  initials?: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS = {
  sm: "size-10 text-sm min-[375px]:size-11",
  md: "size-12 text-base min-[375px]:size-14",
  lg: "size-14 text-xl min-[375px]:size-16",
} as const;

const AVATAR_GRADIENTS = [
  "from-violet-500/25 to-fuchsia-500/15 text-violet-700 dark:text-violet-200",
  "from-sky-500/25 to-cyan-500/15 text-sky-700 dark:text-sky-200",
  "from-amber-500/25 to-orange-500/15 text-amber-700 dark:text-amber-200",
  "from-emerald-500/25 to-teal-500/15 text-emerald-700 dark:text-emerald-200",
] as const;

function getAvatarGradient(title: string): string {
  const hash = [...title].reduce((total, character) => total + character.charCodeAt(0), 0);
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length]!;
}

function getGeneratedAvatarUrl(title: string): string {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(title)}`;
}

function getInitials(title: string): string {
  const parts = title.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

export function ConversationAvatar({
  type,
  title,
  avatarIcon,
  avatarUrl,
  initials,
  isOnline = false,
  size = "md",
  className,
}: ConversationAvatarProps) {
  const displayInitials = initials ?? getInitials(title);
  const resolvedAvatarUrl =
    avatarUrl ?? (type === "direct" ? getGeneratedAvatarUrl(title) : undefined);

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-semibold shadow-sm",
          SIZE_CLASS[size],
          type === "group"
            ? "from-primary/20 to-violet-500/15 text-primary ring-2 ring-primary/20"
            : cn(getAvatarGradient(title), "ring-2 ring-background ring-offset-1 ring-offset-border/50"),
        )}
        aria-hidden="true"
      >
        {resolvedAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolvedAvatarUrl}
            alt=""
            className="size-full bg-muted object-cover"
            loading="lazy"
          />
        ) : type === "group" && avatarIcon ? (
          <span className="text-xl leading-none min-[375px]:text-2xl">{avatarIcon}</span>
        ) : (
          <span>{displayInitials}</span>
        )}
      </div>

      {type === "direct" && isOnline && (
        <OnlineBadge className="absolute -bottom-0.5 -right-0.5" />
      )}
    </div>
  );
}
