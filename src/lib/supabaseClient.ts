import { createClient } from "@supabase/supabase-js";

/**
 * Internal helper – creates client ONLY when needed
 */
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env vars are missing");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * ✅ BACKWARD-COMPATIBLE EXPORT
 * This keeps ALL existing imports working:
 *   import { supabase } from "@/lib/supabaseClient"
 *
 * Client is created lazily (runtime only)
 */
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_target, prop) {
    const client = createSupabaseClient();
    // @ts-ignore
    return client[prop];
  },
});

/**
 * ✅ Explicit server-side usage (optional, future-safe)
 */
export function getSupabaseClient() {
  return createSupabaseClient();
}

/**
 * ✅ Explicit browser/client usage (optional)
 */
export function getBrowserSupabaseClient() {
  return createSupabaseClient();
}
