// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function normalizeUrl(v?: string) {
  if (!v) return "";
  return v
    .trim()
    .replace(/^"|"$|^'|'$/g, "")
    .replace(/\s+/g, "")
    .replace(/[\/.]+$/g, "");
}

let _client: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (_client) return _client;

  const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!supabaseUrl || !/^https?:\/\/.+/i.test(supabaseUrl) || !anonKey) {
    return null;
  }

  _client = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _client;
}

/**
 * ✅ Lazy + build-safe supabase export
 * - No throw at import/build time
 * - Throws only when actually USED and env missing
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = getSupabaseBrowserClient();
    if (!client) {
      throw new Error(
        "Supabase browser client not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    return Reflect.get(client as any, prop, receiver);
  },
});

// Optional backward alias
export const supabaseClient = supabase;
