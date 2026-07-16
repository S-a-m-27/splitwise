"use client";

import type { InvitationErrorVariant } from "@/features/invitations/types/ui";
import { Button } from "@/components/ui/button";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldX, WifiOff } from "lucide-react";

interface InvitationErrorStateProps {
  readonly variant: InvitationErrorVariant;
  readonly className?: string;
  readonly onRetry?: () => void;
  readonly message?: string;
}

const VARIANT_CONFIG: Record<
  InvitationErrorVariant,
  { title: string; description: string; icon: typeof WifiOff }
> = {
  network: {
    title: "Connection problem",
    description: "Check your internet connection and try again.",
    icon: WifiOff,
  },
  permission: {
    title: "Permission denied",
    description: "You don't have access to manage invitations for this group.",
    icon: ShieldX,
  },
  unknown: {
    title: "Something went wrong",
    description: "We couldn't load invitations. Please try again.",
    icon: AlertTriangle,
  },
};

export function InvitationErrorState({
  variant,
  className,
  onRetry,
  message,
}: InvitationErrorStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-destructive/20",
        "bg-destructive/5 px-5 py-10 text-center",
        className,
      )}
      role="alert"
    >
      <div
        className="mb-4 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive"
        aria-hidden="true"
      >
        <Icon className="size-5" />
      </div>
      <h3 className="font-heading text-base font-bold text-foreground">{config.title}</h3>
      <p className={cn("mt-2 max-w-xs leading-relaxed", META_TEXT_CLASS)}>
        {message ?? config.description}
      </p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
