import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Splitwise"),
  NEXT_PUBLIC_ENABLE_PWA: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

function parseClientEnv() {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_ENABLE_PWA: process.env.NEXT_PUBLIC_ENABLE_PWA,
  });

  if (!parsed.success) {
    console.error("Invalid client environment variables:", parsed.error.flatten());
    throw new Error("Invalid client environment variables");
  }

  const data = parsed.data;
  const isVercelProduction = process.env.VERCEL_ENV === "production";
  if (isVercelProduction) {
    const appUrl = data.NEXT_PUBLIC_APP_URL;
    const isLocalhost =
      appUrl.includes("localhost") ||
      appUrl.includes("127.0.0.1") ||
      appUrl.startsWith("http://");
    if (isLocalhost) {
      throw new Error(
        "NEXT_PUBLIC_APP_URL must be a public HTTPS URL in production (OAuth/email redirects depend on it).",
      );
    }
  }

  return data;
}

export const env = parseClientEnv();

export function hasSupabaseEnv(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function assertSupabaseEnv(): {
  url: string;
  anonKey: string;
} {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase environment variables. Copy .env.example to .env.local and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { url, anonKey };
}
