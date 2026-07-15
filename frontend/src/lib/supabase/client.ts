import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { assertSupabaseEnv } from "@/lib/env";

export function createClient() {
  const { url, anonKey } = assertSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
