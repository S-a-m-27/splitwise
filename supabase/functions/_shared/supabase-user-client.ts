import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export function createUserClient(authHeader: string | null): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in Edge runtime.");
  }

  if (!authHeader) {
    throw new Error("Missing Authorization header.");
  }

  return createClient(url, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });
}

export async function requireAuthenticatedUser(
  supabase: SupabaseClient,
): Promise<{ id: string; email?: string }> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Not authenticated");
  }

  return { id: user.id, email: user.email ?? undefined };
}
