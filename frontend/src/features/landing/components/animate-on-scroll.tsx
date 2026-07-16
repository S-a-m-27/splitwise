"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Respects the user's reduced-motion OS preference. */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Direction the element travels from while fading into view. */
type RevealDirection = "up" | "down" | "left" | "right" | "fade" | "scale";

/** Off-screen starting transform applied before the element becomes visible. */
const HIDDEN_TRANSFORMS: Record<RevealDirection, string> = {
  up: "translate-y-8",
  down: "-translate-y-8",
  left: "translate-x-8",
  right: "-translate-x-8",
  scale: "scale-95",
  fade: "",
};

interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
}

/**
 * Intersection-observer scroll reveal. Fires once when the element
 * enters the viewport; respects prefers-reduced-motion.
 *
 * Starts opaque on the server/first paint only briefly; if the observer
 * never fires (common on mobile hard loads), a short fallback reveals
 * content so the landing page cannot stay blank.
 */
export function AnimateOnScroll({
  children,
  className,
  delay = 0,
  direction = "up",
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setVisible(true);
      return;
    }

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      setVisible(true);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
          observer.unobserve(el);
        }
      },
      // threshold 0 + small positive rootMargin: more reliable on short mobile viewports
      { threshold: 0, rootMargin: "0px 0px 0px 0px" },
    );

    observer.observe(el);

    // If already in view on first paint, reveal on the next frame.
    const frame = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const inView =
        rect.bottom > 0 &&
        rect.top < (window.innerHeight || document.documentElement.clientHeight);
      if (inView) reveal();
    });

    // Hard fallback so a missed observer callback never leaves content invisible.
    const fallback = window.setTimeout(reveal, 800);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out will-change-transform",
        !visible && cn("opacity-0", HIDDEN_TRANSFORMS[direction]),
        visible && "translate-x-0 translate-y-0 scale-100 opacity-100",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
