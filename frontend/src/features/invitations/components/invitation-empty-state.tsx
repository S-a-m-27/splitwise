"use client";

import type { InvitationEmptyVariant } from "@/features/invitations/types/ui";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { Inbox, Mail, Search, UserPlus, Users } from "lucide-react";

interface InvitationEmptyStateProps {
  readonly variant: InvitationEmptyVariant;
  readonly className?: string;
  readonly onAction?: () => void;
  readonly actionLabel?: string;
}

const VARIANT_CONFIG: Record<
  InvitationEmptyVariant,
  { title: string; description: string; icon: typeof Inbox }
> = {
  no_invitations: {
    title: "No invitations yet",
    description: "When someone invites you to a group, it will appear here.",
    icon: Inbox,
  },
  no_search_results: {
    title: "No matches found",
    description: "Try a different name or email address.",
    icon: Search,
  },
  no_pending: {
    title: "No pending invitations",
    description: "Everyone in this group has been invited or already joined.",
    icon: Users,
  },
  no_registered_user: {
    title: "No registered user found",
    description: "You can still send an email invitation to this address.",
    icon: Mail,
  },
  waiting_for_registration: {
    title: "Waiting for registration",
    description:
      "This person hasn't signed up yet. They'll see the invitation in the app once they register.",
    icon: UserPlus,
  },
};

export function InvitationEmptyState({
  variant,
  className,
  onAction,
  actionLabel,
}: InvitationEmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80",
        "bg-muted/15 px-5 py-10 text-center animate-in fade-in duration-300",
        "min-[375px]:px-6 min-[375px]:py-12",
        className,
      )}
      role="status"
    >
      <div
        className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <Icon className="size-6" />
      </div>
      <h3 className="font-heading text-base font-bold text-foreground min-[375px]:text-lg">
        {config.title}
      </h3>
      <p className={cn("mt-2 max-w-xs leading-relaxed", META_TEXT_CLASS)}>{config.description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
