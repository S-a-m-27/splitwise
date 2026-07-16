"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmingLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
  isConfirming?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmingLabel = "Please wait…",
  cancelLabel = "Cancel",
  onConfirm,
  variant = "default",
  isConfirming = false,
}: ConfirmationDialogProps) {
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isConfirming) return;
    onOpenChange(nextOpen);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/40 transition-opacity duration-150",
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
            "supports-backdrop-filter:backdrop-blur-xs",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-border bg-card p-5 shadow-xl",
            "transition-all duration-200",
            "data-ending-style:scale-95 data-ending-style:opacity-0",
            "data-starting-style:scale-95 data-starting-style:opacity-0",
          )}
        >
          <Dialog.Title className="font-heading text-lg font-bold text-foreground">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </Dialog.Description>

          {isConfirming && (
            <p
              className="mt-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />
              Working on it…
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 min-[375px]:flex-row min-[375px]:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-11 min-[375px]:h-9"
              disabled={isConfirming}
              onClick={() => handleOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={variant === "destructive" ? "destructive" : "default"}
              className="h-11 gap-2 min-[375px]:h-9"
              disabled={isConfirming}
              onClick={onConfirm}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {confirmingLabel}
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
