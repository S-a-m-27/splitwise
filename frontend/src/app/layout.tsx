import type { Metadata, Viewport } from "next";
import { AppProviders } from "@/providers";
import { baseMetadata } from "@/app/metadata";
import { PWA_CONFIG } from "@/constants";
import { fontHeading, fontSans } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = baseMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: PWA_CONFIG.themeColor },
    { media: "(prefers-color-scheme: dark)", color: PWA_CONFIG.themeColorDark },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontHeading.variable} h-full scroll-smooth`}
    >
      <body className="min-h-dvh font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
