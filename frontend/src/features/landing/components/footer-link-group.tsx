import Link from "next/link";
import type { LandingFooterLink } from "@/features/landing/types";

interface FooterLinkGroupProps {
  title: string;
  links: ReadonlyArray<LandingFooterLink>;
  /** Opens links in a new tab (used for external social URLs). */
  external?: boolean;
}

/** Column of footer navigation links grouped by category. */
export function FooterLinkGroup({
  title,
  links,
  external = false,
}: FooterLinkGroupProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              {...(external && {
                target: "_blank",
                rel: "noopener noreferrer",
              })}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
