import type { Metadata } from "next";
import { LandingPage } from "@/features/landing";
import { APP_CONFIG } from "@/constants";

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} — Split expenses effortlessly`,
  description:
    "Track shared spending, calculate balances automatically, and settle up in seconds. Built for roommates, travelers, couples, and anyone who splits the bill.",
  openGraph: {
    title: `${APP_CONFIG.name} — Split expenses effortlessly`,
    description:
      "Track shared spending, calculate balances automatically, and settle up in seconds.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${APP_CONFIG.name} — Expense sharing made simple`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_CONFIG.name} — Split expenses effortlessly`,
    description:
      "Track shared spending, calculate balances automatically, and settle up in seconds.",
    images: ["/og-image.png"],
  },
};

export default function HomePage() {
  return <LandingPage />;
}
