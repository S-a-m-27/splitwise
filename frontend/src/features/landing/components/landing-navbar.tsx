"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Logo } from "@/features/landing/components/logo";
import { LANDING_NAV_LINKS } from "@/features/landing/constants/content";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="safe-area-top-inset sticky top-0 z-50 w-full bg-transparent px-4 md:px-6 lg:px-8">
      <nav
        aria-label="Main navigation"
        className={cn(
          "glass-nav mx-auto flex h-14 w-full max-w-[430px] items-center justify-between rounded-2xl border px-3.5 transition-all duration-300 sm:px-4",
          "md:h-16 md:max-w-5xl md:rounded-2xl md:px-5",
          "lg:max-w-6xl",
          scrolled && "glass-nav-scrolled",
        )}
      >
        <Logo />

        {/* Desktop nav — hidden on mobile (strict mobile-first) */}
        <div className="hidden items-center gap-0.5 md:flex">
          {LANDING_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative rounded-lg px-3.5 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="sm"
            className="text-[13px] font-medium"
            render={<Link href={ROUTES.login} />}
          >
            Log in
          </Button>
          <Button
            size="sm"
            className="btn-premium h-9 border-0 px-4 text-[13px] font-semibold"
            render={<Link href={ROUTES.register} />}
          >
            Get started
          </Button>
        </div>

        {/* Mobile menu trigger — primary nav on small screens */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-xl md:hidden",
            "bg-accent/60 text-foreground transition-colors",
            "hover:bg-accent active:scale-95",
            "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          )}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t px-0 pb-8 md:hidden"
          showCloseButton
        >
          <SheetHeader className="border-b px-6 pb-4">
            <SheetTitle className="flex justify-center">
              <Logo showText />
            </SheetTitle>
          </SheetHeader>

          <nav className="flex flex-col px-4 pt-2" aria-label="Mobile menu">
            {LANDING_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center rounded-xl px-4 text-[15px] font-medium transition-colors active:bg-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-3 border-t px-4 pt-6">
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-full text-[15px] font-semibold"
              render={<Link href={ROUTES.login} onClick={() => setOpen(false)} />}
            >
              Log in
            </Button>
            <Button
              size="lg"
              className="btn-premium h-12 w-full border-0 text-[15px] font-semibold"
              render={<Link href={ROUTES.register} onClick={() => setOpen(false)} />}
            >
              Get started free
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
