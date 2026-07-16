"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Paperclip, Send, Smile } from "lucide-react";
import { MAX_MESSAGE_LENGTH } from "@/features/chat/validation/chat.schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MessageComposerProps {
  className?: string;
  placeholder?: string;
  showCharacterCount?: boolean;
  onSend?: (content: string) => Promise<unknown> | unknown;
  onTyping?: () => void;
  onTypingStop?: () => Promise<unknown> | unknown;
  disabled?: boolean;
}

export function MessageComposer({
  className,
  placeholder = "Type a message…",
  showCharacterCount = false,
  onSend,
  onTyping,
  onTypingStop,
  disabled = false,
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);

  const resizeTextarea = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
  }, []);

  function handleChange(next: string) {
    if (next.length <= MAX_MESSAGE_LENGTH) {
      setValue(next);
      resizeTextarea();
      if (next.trim()) onTyping?.();
      else void onTypingStop?.();
    }
  }

  const canSend = value.trim().length > 0;
  const charCount = value.length;

  async function handleSend() {
    if (!canSend || !onSend || isSending || disabled) return;
    const content = value.trim();
    setIsSending(true);
    try {
      await onTypingStop?.();
      await onSend(content);
      setValue("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch {
      // The optimistic message is marked failed by the lifecycle and can be retried.
    } finally {
      setIsSending(false);
    }
  }

  useEffect(
    () => () => {
      void onTypingStop?.();
    },
    [onTypingStop],
  );

  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 border-t border-border/70 bg-card/90 px-3.5 py-3 shadow-[0_-8px_30px_-24px_rgba(0,0,0,0.6)] backdrop-blur-xl",
        "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
        "min-[375px]:px-5 min-[375px]:py-3.5",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-4xl items-end gap-2.5">
        <div className="flex shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 rounded-full text-muted-foreground"
            disabled
            aria-label="Attach file (coming soon)"
          >
            <Paperclip className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <div className="relative min-w-0 flex-1">
          <label htmlFor="chat-message-input" className="sr-only">
            Message
          </label>
          <textarea
            ref={textareaRef}
            id="chat-message-input"
            rows={1}
            value={value}
            onChange={(event) => handleChange(event.target.value)}
            onBlur={() => void onTypingStop?.()}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className={cn(
              "max-h-32 min-h-12 w-full resize-none rounded-[1.35rem] border border-border/80 bg-muted/45 py-3 pr-12 pl-4 text-[15px] leading-6 shadow-inner",
              "placeholder:text-muted-foreground/70",
              "transition-colors focus-visible:border-primary/45 focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none",
            )}
            aria-describedby={showCharacterCount ? "char-count" : undefined}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 bottom-1 size-10 rounded-full text-muted-foreground"
            disabled
            aria-label="Add emoji (coming soon)"
          >
            <Smile className="size-[1.125rem]" aria-hidden="true" />
          </Button>
          {showCharacterCount && charCount > MAX_MESSAGE_LENGTH * 0.8 && (
            <span
              id="char-count"
              className="absolute -top-5 right-1 text-[10px] text-muted-foreground"
            >
              {charCount}/{MAX_MESSAGE_LENGTH}
            </span>
          )}
        </div>

        {canSend ? (
          <Button
            type="button"
            size="icon"
            className="size-12 shrink-0 rounded-full shadow-md shadow-primary/20"
            disabled={disabled || isSending || !onSend}
            onClick={() => void handleSend()}
            aria-label="Send message"
          >
            <Send className="size-5" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-12 shrink-0 rounded-full text-muted-foreground"
            disabled
            aria-label="Voice message (coming soon)"
          >
            <Mic className="size-5" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
