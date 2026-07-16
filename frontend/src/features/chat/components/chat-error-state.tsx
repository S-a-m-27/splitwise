"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ChatErrorVariant = "connection" | "messages" | "not-found";

const VARIANT_COPY: Record<ChatErrorVariant, { title: string; description: string }> = {
  connection: {
    title: "Connection error",
    description: "Check your internet connection and try again.",
  },
  messages: {
    title: "Unable to load messages",
    description: "Something went wrong while loading this conversation.",
  },
  "not-found": {
    title: "Conversation not found",
    description: "This conversation may have been removed or you no longer have access.",
  },
};

interface ChatErrorStateProps {
  variant?: ChatErrorVariant;
  onRetry?: () => void;
  className?: string;
}

export function ChatErrorState({
  variant = "messages",
  onRetry,
  className,
}: ChatErrorStateProps) {
  const copy = VARIANT_COPY[variant];

  return (
    <div
      className={cn(
        "flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-10 text-center",
        "min-[375px]:min-h-[16rem] min-[375px]:rounded-2xl",
        className,
      )}
      role="alert"
    >
      <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <WifiOff className="size-5" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-base font-bold text-foreground min-[375px]:text-lg">
        {copy.title}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{copy.description}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
