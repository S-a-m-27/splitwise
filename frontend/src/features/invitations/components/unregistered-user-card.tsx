"use client";

import { Mail, UserPlus } from "lucide-react";
import { InviteButton } from "@/features/invitations/components/invite-button";
import { RegistrationStatusChip } from "@/features/invitations/components/invitation-status-chip";
import { maskEmail } from "@/features/invitations/utils/mask-email";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface UnregisteredUserCardProps {
  readonly email: string;
  readonly onInvite: () => void;
  readonly className?: string;
  readonly disabled?: boolean;
}

export function UnregisteredUserCard({ email, onInvite, className, disabled = false }: UnregisteredUserCardProps) {
  return (
    <article
      className={cn(
        "rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5 shadow-sm",
        "animate-in fade-in slide-in-from-bottom-3 duration-300",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"
          aria-hidden="true"
        >
          <Mail className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold tracking-wide text-primary uppercase">Invite by Email</p>
          <p className="mt-1 truncate text-base font-semibold text-foreground">{maskEmail(email)}</p>
          <div className="mt-2">
            <RegistrationStatusChip isRegistered={false} />
          </div>
        </div>
      </div>

      <p className={cn("mt-4 leading-relaxed", META_TEXT_CLASS)}>
        This user does not have an account yet. An email invitation will be sent. Once they
        register, they will receive the invitation inside the app.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 py-2.5">
        <UserPlus className="size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-foreground/80 min-[375px]:text-[13px]">
          Invitation will be sent via email
        </p>
      </div>

      <InviteButton onClick={onInvite} label={disabled ? "Sending…" : "Send Email Invite"} className="mt-4 w-full" disabled={disabled} />
    </article>
  );
}
