import { CalendarDays, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/features/dashboard/components/user-avatar";
import type { ProfileUser } from "@/features/profile/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface AvatarCardProps {
  profile: ProfileUser;
  className?: string;
}

/** Centered avatar block with identity details. */
export function AvatarCard({ profile, className }: AvatarCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        className,
      )}
    >
      <UserAvatar
        name={profile.fullName}
        avatarUrl={profile.avatarUrl}
        initials={profile.initials}
        size="lg"
        className="size-20 text-xl ring-4 ring-primary/15 min-[375px]:size-24 min-[375px]:text-2xl"
      />

      <h2 className="mt-4 font-heading text-xl font-bold text-foreground min-[375px]:text-2xl">
        {profile.fullName}
      </h2>

      <div className="mt-3 flex w-full max-w-xs flex-col gap-2">
        <p className={cn("flex items-center justify-center gap-2", META_TEXT_CLASS)}>
          <Mail className="size-3.5 shrink-0 text-primary/70" aria-hidden="true" />
          <span className="truncate">{profile.email}</span>
        </p>
        <p className={cn("flex items-center justify-center gap-2", META_TEXT_CLASS)}>
          <CalendarDays className="size-3.5 shrink-0 text-primary/70" aria-hidden="true" />
          <span>Member since {profile.memberSince}</span>
        </p>
      </div>
    </div>
  );
}

interface ProfileHeaderProps {
  profile: ProfileUser;
  editHref: string;
  className?: string;
}

/** Hero profile header with gradient backdrop and edit action. */
export function ProfileHeader({ profile, editHref, className }: ProfileHeaderProps) {
  return (
    <section
      aria-labelledby="profile-identity-heading"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-md",
        "min-[375px]:rounded-3xl",
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary/12 via-violet-500/8 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute -top-10 -right-10 size-32 rounded-full bg-primary/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative px-4 py-6 min-[375px]:px-6 min-[375px]:py-8">
        <h2 id="profile-identity-heading" className="sr-only">
          Your profile
        </h2>

        <AvatarCard profile={profile} />

        <div className="mt-6 flex justify-center">
          <Button
            render={<Link href={editHref} />}
            variant="outline"
            className="h-11 min-w-[10rem] rounded-xl border-primary/25 bg-background/80 font-semibold shadow-sm backdrop-blur-sm"
          >
            Edit Profile
          </Button>
        </div>
      </div>
    </section>
  );
}
