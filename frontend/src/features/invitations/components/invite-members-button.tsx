"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteModal } from "@/features/invitations/components/invite-modal";
import { cn } from "@/lib/utils";

interface InviteMembersButtonProps {
  readonly groupId: string;
  readonly groupName: string;
  readonly groupIcon?: string;
  readonly className?: string;
  readonly fullWidth?: boolean;
}

export function InviteMembersButton({
  groupId,
  groupName,
  groupIcon,
  className,
  fullWidth = true,
}: InviteMembersButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className={cn("h-11 gap-2 rounded-xl font-semibold", fullWidth && "flex-1", className)}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <UserPlus className="size-4" aria-hidden="true" />
        Invite Members
      </Button>

      <InviteModal
        open={open}
        onOpenChange={setOpen}
        groupId={groupId}
        groupName={groupName}
        groupIcon={groupIcon}
      />
    </>
  );
}
