"use client";

import { Check, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ExpenseParticipant } from "@/features/expenses/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface ParticipantSelectorProps {
  participants: ExpenseParticipant[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

export function ParticipantSelector({
  participants,
  selectedIds,
  onChange,
  className,
}: ParticipantSelectorProps) {
  function toggleParticipant(participantId: string) {
    const isSelected = selectedIds.includes(participantId);

    if (isSelected) {
      if (selectedIds.length <= 1) return;
      onChange(selectedIds.filter((id) => id !== participantId));
      return;
    }

    onChange([...selectedIds, participantId]);
  }

  function selectAll() {
    onChange(participants.map((p) => p.id));
  }

  function selectOnlyYou() {
    const you = participants.find((p) => p.isCurrentUser);
    if (you) onChange([you.id]);
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 flex-1 rounded-xl border-primary/20 bg-primary/5 text-xs font-semibold"
          onClick={selectAll}
        >
          <Users className="size-3.5" aria-hidden="true" />
          Everyone
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 flex-1 rounded-xl text-xs font-semibold"
          onClick={selectOnlyYou}
        >
          <UserPlus className="size-3.5" aria-hidden="true" />
          Just me
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {participants.map((participant) => {
          const isSelected = selectedIds.includes(participant.id);

          return (
            <button
              key={participant.id}
              type="button"
              onClick={() => toggleParticipant(participant.id)}
              className={cn(
                "flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                isSelected
                  ? "border-primary/40 bg-gradient-to-r from-primary/12 to-violet-500/8 shadow-md shadow-primary/5"
                  : "border-border/80 bg-muted/20 hover:border-primary/25 hover:bg-muted/40 active:scale-[0.99]",
              )}
              aria-pressed={isSelected}
            >
              <Avatar
                size="sm"
                className={cn(
                  "size-10 transition-transform duration-200",
                  isSelected && "ring-2 ring-primary/40",
                )}
              >
                <AvatarFallback
                  className={cn(
                    "text-xs font-bold",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {participant.initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {participant.name}
                  {participant.isCurrentUser && (
                    <span className="ml-1.5 font-normal text-muted-foreground">(you)</span>
                  )}
                  {participant.isGuest && !participant.isCurrentUser && (
                    <span className="ml-1.5 font-normal text-muted-foreground">(guest)</span>
                  )}
                </p>
              </div>

              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                  isSelected
                    ? "scale-100 border-primary bg-primary text-primary-foreground"
                    : "scale-90 border-border/80 bg-background/50 text-transparent",
                )}
                aria-hidden="true"
              >
                <Check className="size-4" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>

      <p className={cn("rounded-lg bg-muted/30 px-3 py-2 text-center", META_TEXT_CLASS)}>
        <span className="font-bold text-primary">{selectedIds.length}</span> of{" "}
        {participants.length} sharing this expense
      </p>
    </div>
  );
}
