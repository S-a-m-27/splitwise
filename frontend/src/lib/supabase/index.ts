/**
 * Public barrel for Supabase utilities.
 *
 * ⚠️  ONLY the browser client is exported here.
 * Server-side utilities import `next/headers` and MUST be imported directly:
 *   - Server Components / Route Handlers → import from "@/lib/supabase/server"
 *   - Middleware                          → import from "@/lib/supabase/middleware"
 *
 * Importing those here would bundle `next/headers` into the client, crashing the app.
 */
export { createClient as createBrowserClient } from "@/lib/supabase/client";
