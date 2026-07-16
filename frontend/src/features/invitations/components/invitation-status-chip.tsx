"use client";

import type { InvitationStatus } from "@/features/invitations/constants/invitation.constants";
import { cn } from "@/lib/utils";
import {
  Ban,
  CheckCircle2,
  Clock3,
  Hourglass,
  Mail,
  XCircle,
} from "lucide-react";

interface InvitationStatusChipProps {
  readonly status: InvitationStatus;
  readonly isRegistered?: boolean;
  readonly className?: string;
}

const STATUS_CONFIG: Record<
  InvitationStatus,
  { label: string; icon: typeof Clock3; className: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock3,
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  accepted: {
    label: "Accepted",
    icon: CheckCircle2,
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  },
  declined: {
    label: "Declined",
    icon: XCircle,
    className: "border-destructive/25 bg-destructive/10 text-destructive",
  },
  expired: {
    label: "Expired",
    icon: Hourglass,
    className: "border-border/80 bg-muted/60 text-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    icon: Ban,
    className: "border-border/80 bg-muted/60 text-muted-foreground",
  },
};

export function InvitationStatusChip({
  status,
  isRegistered = true,
  className,
}: InvitationStatusChipProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const label =
    status === "pending" && !isRegistered ? "Waiting for Registration" : config.label;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5",
        "text-[10px] font-bold uppercase tracking-wide",
        config.className,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </span>
  );
}

interface RegistrationStatusChipProps {
  readonly isRegistered: boolean;
  readonly className?: string;
}

export function RegistrationStatusChip({
  isRegistered,
  className,
}: RegistrationStatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5",
        "text-[10px] font-bold uppercase tracking-wide",
        isRegistered
          ? "border-primary/25 bg-primary/10 text-primary"
          : "border-border/80 bg-muted/60 text-muted-foreground",
        className,
      )}
    >
      <Mail className="size-3" aria-hidden="true" />
      {isRegistered ? "Registered" : "Not Registered"}
    </span>
  );
}
