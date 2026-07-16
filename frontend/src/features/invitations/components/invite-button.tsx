"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InviteButtonProps {
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly size?: "default" | "sm";
  readonly className?: string;
}

export function InviteButton({
  onClick,
  disabled = false,
  label = "Invite",
  size = "default",
  className,
}: InviteButtonProps) {
  return (
    <Button
      type="button"
      size={size}
      className={cn("gap-2 rounded-xl font-semibold", size === "default" && "h-11", className)}
      disabled={disabled}
      onClick={onClick}
    >
      <UserPlus className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
