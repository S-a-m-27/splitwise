import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  initials: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASS = {
  sm: "size-9 min-[375px]:size-10 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
} as const;

/** Avatar image with initials fallback when no URL is set. */
export function UserAvatar({
  name,
  avatarUrl,
  initials,
  className,
  size = "sm",
}: UserAvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`${name} profile`}
        width={48}
        height={48}
        className={cn(
          "shrink-0 rounded-full object-cover ring-2 ring-primary/20",
          SIZE_CLASS[size],
          className,
        )}
        loading="eager"
        decoding="async"
        fetchPriority="high"
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${name} profile`}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary ring-2 ring-primary/20",
        SIZE_CLASS[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}
