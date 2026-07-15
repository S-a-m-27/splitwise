import Link from "next/link";
import { Receipt } from "lucide-react";
import { APP_CONFIG } from "@/constants/config";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export function Logo({ className, showText = true }: LogoProps) {
  return (
    <Link
      href={ROUTES.home}
      className={cn(
        "group flex items-center gap-2.5 transition-opacity hover:opacity-90",
        className,
      )}
      aria-label={`${APP_CONFIG.name} home`}
    >
      <span className="logo-glow relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70">
        <Receipt
          className="size-4.5 text-primary-foreground"
          aria-hidden="true"
        />
        <span
          className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        />
      </span>
      {showText && (
        <span className="text-[15px] font-bold tracking-tight sm:text-base">
          {APP_CONFIG.name}
        </span>
      )}
    </Link>
  );
}
