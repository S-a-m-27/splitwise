"use client";

import Link from "next/link";
import {
  ChevronRight,
  FileText,
  Info,
  KeyRound,
  LogOut,
  Settings2,
  Shield,
  UserPen,
  type LucideIcon,
} from "lucide-react";
import type { SettingsItemConfig } from "@/features/profile/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

const SETTINGS_ICONS: Record<SettingsItemConfig["id"], LucideIcon> = {
  "edit-profile": UserPen,
  "change-password": KeyRound,
  preferences: Settings2,
  privacy: Shield,
  about: Info,
  logout: LogOut,
};

interface SettingsItemProps {
  item: SettingsItemConfig;
  onAction?: (item: SettingsItemConfig) => void;
  isLast?: boolean;
}

/** Tappable settings row with icon, label, and chevron. */
export function SettingsItem({ item, onAction, isLast = false }: SettingsItemProps) {
  const Icon = SETTINGS_ICONS[item.id];

  const content = (
    <>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          item.destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-4.5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-semibold min-[375px]:text-[15px]",
            item.destructive ? "text-destructive" : "text-foreground",
          )}
        >
          {item.label}
        </p>
        {item.description && (
          <p className={cn("mt-0.5 truncate", META_TEXT_CLASS)}>{item.description}</p>
        )}
      </div>

      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground/70"
        aria-hidden="true"
      />
    </>
  );

  const rowClassName = cn(
    "flex min-h-[3.75rem] w-full items-center gap-3 px-3 py-3 text-left transition-colors",
    "hover:bg-muted/40 active:bg-muted/60",
    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
    !isLast && "border-b border-border/60",
  );

  if (item.href) {
    return (
      <Link href={item.href} className={rowClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={rowClassName} onClick={() => onAction?.(item)}>
      {content}
    </button>
  );
}

interface SettingsListProps {
  items: readonly SettingsItemConfig[];
  onAction?: (item: SettingsItemConfig) => void;
  className?: string;
}

export function SettingsList({ items, onAction, className }: SettingsListProps) {
  return (
    <nav aria-label="Profile settings" className={className}>
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
        {items.map((item, index) => (
          <SettingsItem
            key={item.id}
            item={item}
            onAction={onAction}
            isLast={index === items.length - 1}
          />
        ))}
      </div>
    </nav>
  );
}

/** Placeholder legal link row for About screen. */
export function AboutLinkItem({
  label,
  description,
  isLast = false,
  onPlaceholderClick,
}: {
  label: string;
  description: string;
  isLast?: boolean;
  onPlaceholderClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex min-h-[3.75rem] w-full items-center gap-3 px-4 py-3 text-left transition-colors",
        "hover:bg-muted/40 active:bg-muted/60",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        !isLast && "border-b border-border/60",
      )}
      onClick={onPlaceholderClick}
      aria-label={`${label} — placeholder`}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/70">
        <FileText className="size-4.5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground min-[375px]:text-[15px]">
          {label}
        </p>
        <p className={cn("mt-0.5 truncate", META_TEXT_CLASS)}>{description}</p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" aria-hidden="true" />
    </button>
  );
}
