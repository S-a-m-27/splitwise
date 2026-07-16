"use client";

import type { InviteSearchResult } from "@/features/invitations/types/ui";
import { InviteButton } from "@/features/invitations/components/invite-button";
import {
  RegistrationStatusChip,
} from "@/features/invitations/components/invitation-status-chip";
import { UserAvatar } from "@/features/dashboard/components/user-avatar";
import { maskEmail } from "@/features/invitations/utils/mask-email";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { UserCheck, UserX } from "lucide-react";

interface RegisteredUserCardProps {
  readonly result: InviteSearchResult;
  readonly onInvite: () => void;
  readonly className?: string;
  readonly inviteDisabled?: boolean;
}

function getActionState(result: InviteSearchResult): {
  disabled: boolean;
  label: string;
  hint: string | null;
} {
  switch (result.state) {
    case "already_member":
      return { disabled: true, label: "Already Member", hint: "This person is already in the group." };
    case "invitation_pending":
      return {
        disabled: true,
        label: "Invitation Pending",
        hint: "An invitation is already on its way.",
      };
    default:
      return { disabled: false, label: "Invite", hint: null };
  }
}

export function RegisteredUserCard({ result, onInvite, className, inviteDisabled = false }: RegisteredUserCardProps) {
  const action = getActionState(result);
  const disabled = action.disabled || inviteDisabled;
  const initials = result.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm",
        "transition-shadow hover:shadow-md",
        className,
      )}
    >
      <UserAvatar
        name={result.displayName}
        avatarUrl={result.avatarUrl ?? undefined}
        initials={initials}
        size="md"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{result.displayName}</p>
        <p className={cn("mt-0.5 truncate", META_TEXT_CLASS)}>{maskEmail(result.email)}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <RegistrationStatusChip isRegistered={result.isRegistered} />
          {result.state === "already_member" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/80 bg-muted/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              <UserCheck className="size-3" aria-hidden="true" />
              In Group
            </span>
          )}
          {result.state === "invitation_pending" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
              <UserX className="size-3" aria-hidden="true" />
              Pending
            </span>
          )}
        </div>
        {action.hint && (
          <p className={cn("mt-2 text-xs leading-relaxed", META_TEXT_CLASS)}>{action.hint}</p>
        )}
      </div>

      <InviteButton
        onClick={onInvite}
        disabled={disabled}
        label={inviteDisabled ? "Sending…" : action.label}
        size="sm"
        className="shrink-0"
      />
    </article>
  );
}
