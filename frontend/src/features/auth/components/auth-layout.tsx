"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { APP_CONFIG } from "@/constants/config";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    return (
        /*
         * Inherits the root Indigo-Violet palette for visual continuity with the landing page.
         */
        <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-10">

            {/* ── Background layers (mirrors landing hero) ─────────────────── */}

            {/* Aurora blobs — same animation as landing */}
            <div className="aurora" aria-hidden="true" />

            {/* Radial top glow */}
            <div
                className="gradient-glow pointer-events-none absolute inset-0"
                aria-hidden="true"
            />

            {/* Animated grid overlay */}
            <div
                className="animate-grid-pan pointer-events-none absolute inset-0 opacity-[0.18]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
                    backgroundSize: "3.5rem 3.5rem",
                    maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
                }}
                aria-hidden="true"
            />

            {/* ── Back button ───────────────────────────────────────────────── */}
            <div className="absolute top-5 left-5 z-20">
                <Link
                    href={ROUTES.home}
                    className="group flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:border-primary/30 hover:bg-accent/60 hover:text-foreground active:scale-95"
                >
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                    Back
                </Link>
            </div>

            {/* ── Auth card ─────────────────────────────────────────────────── */}
            <div className="relative z-10 w-full max-w-[400px]">

                {/* Logo + heading — outside the card, floating above it */}
                <div className="mb-6 flex flex-col items-center gap-3 text-center">
                    {/* Icon with pulsing halo ring */}
                    <div className="animate-pulse-glow relative flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/60 shadow-md backdrop-blur-sm">
                        <Wallet className="h-6 w-6 text-primary" />
                        {/* Soft glow ring behind icon */}
                        <div
                            className="absolute -inset-2 rounded-3xl opacity-20 blur-xl"
                            style={{
                                background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
                            }}
                            aria-hidden="true"
                        />
                    </div>

                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary/70">
                            {APP_CONFIG.name}
                        </p>
                        <h1 className="mt-0.5 font-heading text-2xl font-extrabold tracking-tight text-foreground">
                            {title}
                        </h1>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {/* Glassmorphism card */}
                <div
                    className="card-glow rounded-3xl border border-border/70 bg-card/80 p-6 shadow-xl backdrop-blur-xl sm:p-7"
                    style={{
                        /* Extra inner border highlight on top edge */
                        boxShadow:
                            "0 0 0 1px color-mix(in oklch, var(--primary) 8%, transparent), 0 8px 40px color-mix(in oklch, var(--primary) 8%, transparent), 0 1px 0 white inset",
                    }}
                >
                    {children}
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-[11px] text-muted-foreground/60 select-none">
                    © {new Date().getFullYear()} {APP_CONFIG.name} · End-to-end secure
                </p>
            </div>
        </div>
    );
}
