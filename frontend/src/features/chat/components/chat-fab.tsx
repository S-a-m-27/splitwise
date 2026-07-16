"use client";

import { Plus } from "lucide-react";
import { MOBILE_FAB_RIGHT_CLASS } from "@/features/dashboard/constants/layout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChatFabProps {
  onClick: () => void;
  className?: string;
}

export function ChatFab({ onClick, className }: ChatFabProps) {
  return (
    <div
      className={cn(
        "fixed z-40",
        MOBILE_FAB_RIGHT_CLASS,
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] xl:bottom-8",
        className,
      )}
    >
      <Button
        type="button"
        onClick={onClick}
        aria-label="Start new chat"
        className={cn(
          "size-12 rounded-full bg-primary text-primary-foreground shadow-lg min-[375px]:size-14",
          "transition-transform duration-200 active:scale-90 hover:scale-105",
        )}
      >
        <Plus className="size-5 min-[375px]:size-6" strokeWidth={2.5} aria-hidden="true" />
      </Button>
    </div>
  );
}
