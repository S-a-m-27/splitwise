"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  groupEditRoute,
  groupInviteRoute,
} from "@/constants/routes";
import {
  LogOut,
  MoreVertical,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

interface GroupActionsMenuProps {
  groupId: string;
  isOwner: boolean;
  onDeleteClick: () => void;
  onLeaveClick: () => void;
}

export function GroupActionsMenu({
  groupId,
  isOwner,
  onDeleteClick,
  onLeaveClick,
}: GroupActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="size-11"
            aria-label="Group actions"
          />
        }
      >
        <MoreVertical className="size-4" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem render={<Link href={groupInviteRoute(groupId)} />}>
          <UserPlus className="size-4" aria-hidden="true" />
          Invite members
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={groupEditRoute(groupId)} />}>
          <Pencil className="size-4" aria-hidden="true" />
          Edit group
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {!isOwner && (
          <DropdownMenuItem
            variant="destructive"
            onClick={onLeaveClick}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Leave group
          </DropdownMenuItem>
        )}
        {isOwner && (
          <DropdownMenuItem
            variant="destructive"
            onClick={onDeleteClick}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete group
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
