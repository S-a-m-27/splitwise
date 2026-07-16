"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AtSign, Mic, Paperclip, Send, Smile } from "lucide-react";
import { MAX_MESSAGE_LENGTH } from "@/features/chat/validation/chat.schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConversationMember } from "@/features/chat/types";
import {
  findActiveMention,
  getMemberMentionLabel,
  insertMention,
  type ActiveMention,
} from "@/features/chat/utils/mentions";

interface MessageComposerProps {
  className?: string;
  placeholder?: string;
  showCharacterCount?: boolean;
  onSend?: (content: string, mentionedUserIds: string[]) => Promise<unknown> | unknown;
  onTyping?: () => void;
  onTypingStop?: () => Promise<unknown> | unknown;
  disabled?: boolean;
  mentionCandidates?: ConversationMember[];
}

export function MessageComposer({
  className,
  placeholder = "Type a message…",
  showCharacterCount = false,
  onSend,
  onTyping,
  onTypingStop,
  disabled = false,
  mentionCandidates = [],
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeMention, setActiveMention] = useState<ActiveMention | null>(null);
  const [selectedMentions, setSelectedMentions] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [highlightedMentionIndex, setHighlightedMentionIndex] = useState(0);

  const filteredMentionCandidates = useMemo(() => {
    if (!activeMention) return [];
    const query = activeMention.query.toLocaleLowerCase();
    return mentionCandidates
      .filter((member) => {
        const name = getMemberMentionLabel(member).toLocaleLowerCase();
        return name.includes(query) || member.email?.toLocaleLowerCase().includes(query);
      })
      .slice(0, 6);
  }, [activeMention, mentionCandidates]);

  const duplicateNameCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const member of mentionCandidates) {
      const name = member.displayName?.trim().toLocaleLowerCase();
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return counts;
  }, [mentionCandidates]);

  const resizeTextarea = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 128)}px`;
  }, []);

  function handleChange(next: string, cursorPosition: number) {
    if (next.length <= MAX_MESSAGE_LENGTH) {
      setValue(next);
      setActiveMention(findActiveMention(next, cursorPosition));
      setHighlightedMentionIndex(0);
      resizeTextarea();
      if (next.trim()) onTyping?.();
      else void onTypingStop?.();
    }
  }

  const canSend = value.trim().length > 0;
  const charCount = value.length;

  function selectMention(member: ConversationMember) {
    if (!activeMention) return;
    const label = getMemberMentionLabel(member);
    const inserted = insertMention(value, activeMention, label);
    setValue(inserted.value);
    setSelectedMentions((current) => {
      const next = new Map(current);
      next.set(member.userId, label);
      return next;
    });
    setActiveMention(null);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(inserted.cursorPosition, inserted.cursorPosition);
      resizeTextarea();
    });
  }

  async function handleSend() {
    if (!canSend || !onSend || isSending || disabled) return;
    const content = value.trim();
    const mentionedUserIds = [...selectedMentions.entries()]
      .filter(([, label]) => content.includes(`@${label}`))
      .map(([userId]) => userId);
    setIsSending(true);
    try {
      await onTypingStop?.();
      await onSend(content, mentionedUserIds);
      setValue("");
      setSelectedMentions(new Map());
      setActiveMention(null);
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
          {activeMention && filteredMentionCandidates.length > 0 && (
            <div
              id="chat-mention-suggestions"
              role="listbox"
              aria-label="Mention a group member"
              className="absolute right-0 bottom-[calc(100%+0.5rem)] left-0 z-30 max-h-64 overflow-y-auto rounded-2xl border border-border bg-popover p-1.5 shadow-xl"
            >
              <div className="flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-muted-foreground">
                <AtSign className="size-3.5" aria-hidden="true" />
                Mention a group member
              </div>
              {filteredMentionCandidates.map((member, index) => {
                const label = getMemberMentionLabel(member);
                const duplicateName =
                  (duplicateNameCounts.get(
                    member.displayName?.trim().toLocaleLowerCase() ?? "",
                  ) ?? 0) > 1;
                return (
                  <button
                    key={member.userId}
                    type="button"
                    role="option"
                    aria-selected={index === highlightedMentionIndex}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      index === highlightedMentionIndex
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted",
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectMention(member)}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {label.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{label}</span>
                      {duplicateName && member.email && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <label htmlFor="chat-message-input" className="sr-only">
            Message
          </label>
          <textarea
            ref={textareaRef}
            id="chat-message-input"
            role="combobox"
            rows={1}
            value={value}
            onChange={(event) =>
              handleChange(event.target.value, event.target.selectionStart)
            }
            onBlur={() => void onTypingStop?.()}
            onKeyDown={(event) => {
              if (activeMention && filteredMentionCandidates.length > 0) {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  const direction = event.key === "ArrowDown" ? 1 : -1;
                  setHighlightedMentionIndex(
                    (current) =>
                      (current + direction + filteredMentionCandidates.length) %
                      filteredMentionCandidates.length,
                  );
                  return;
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setActiveMention(null);
                  return;
                }
                if (event.key === "Enter" || event.key === "Tab") {
                  event.preventDefault();
                  const selected =
                    filteredMentionCandidates[highlightedMentionIndex];
                  if (selected) selectMention(selected);
                  return;
                }
              }
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
            aria-controls={
              activeMention && filteredMentionCandidates.length > 0
                ? "chat-mention-suggestions"
                : undefined
            }
            aria-expanded={activeMention ? filteredMentionCandidates.length > 0 : false}
            aria-autocomplete="list"
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
