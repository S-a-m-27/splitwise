import type { Metadata } from "next";
import { APP_CONFIG } from "@/constants";

const siteUrl = APP_CONFIG.url;

export const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  applicationName: APP_CONFIG.name,
  authors: [{ name: APP_CONFIG.name }],
  creator: APP_CONFIG.name,
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_CONFIG.name,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: APP_CONFIG.name,
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
  },
  twitter: {
    card: "summary",
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192x192.png",
  },
};

export function createPageMetadata(
  title: string,
  description?: string,
): Metadata {
  const pageDescription = description ?? APP_CONFIG.description;

  return {
    title,
    description: pageDescription,
    openGraph: {
      title,
      description: pageDescription,
    },
    twitter: {
      title,
      description: pageDescription,
    },
  };
}
