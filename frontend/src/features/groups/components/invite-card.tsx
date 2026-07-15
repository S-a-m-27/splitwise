"use client";

import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InviteCardProps {
  inviteLink: string;
  groupName: string;
  className?: string;
}

export function InviteCard({ inviteLink, groupName, className }: InviteCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Invite link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function handleShare() {
    const shareData = {
      title: `Join ${groupName}`,
      text: `You're invited to join "${groupName}" on our expense-sharing app.`,
      url: inviteLink,
    };

    if (typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    await handleCopy();
    toast.info("Link copied — paste it in WhatsApp, Telegram, or any chat app.");
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card p-4 shadow-sm min-[375px]:rounded-2xl min-[375px]:p-5",
        className,
      )}
    >
      <h2 className="font-heading text-base font-bold text-foreground">Invite link</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Share this link with friends to invite them to{" "}
        <span className="font-medium text-foreground">{groupName}</span>. They can join
        using any messaging app.
      </p>

      <div className="mt-4 flex flex-col gap-2 min-[375px]:flex-row">
        <Input
          readOnly
          value={inviteLink}
          aria-label="Group invite link"
          className="h-11 min-w-0 flex-1 font-mono text-xs"
        />
        <Button
          type="button"
          variant="outline"
          className="h-11 shrink-0 gap-2"
          onClick={handleCopy}
        >
          <Copy className="size-4" aria-hidden="true" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <Button
        type="button"
        className="mt-3 h-11 w-full gap-2"
        onClick={handleShare}
      >
        <Share2 className="size-4" aria-hidden="true" />
        Share invite
      </Button>
    </div>
  );
}
