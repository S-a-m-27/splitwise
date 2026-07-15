import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

/**
 * PWA via @ducanh2912/next-pwa (maintained next-pwa fork).
 * Enable with NEXT_PUBLIC_ENABLE_PWA=true, then run `npm run build:pwa`.
 */
function withOptionalPwa(config: NextConfig): NextConfig {
  if (process.env.NEXT_PUBLIC_ENABLE_PWA !== "true") {
    return config;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withPWAInit = require("@ducanh2912/next-pwa").default;

  return withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
    register: true,
    reloadOnOnline: true,
    fallbacks: {
      document: "/offline",
    },
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      disableDevLogs: true,
      // Do not set navigateFallback for Next.js App Router — it can serve
      // /offline for normal navigations when HTML routes are not precached.
    },
  })(config);
}

export default withOptionalPwa(nextConfig);
