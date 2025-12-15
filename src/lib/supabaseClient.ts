// src/lib/supabaseClient.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Normalize Supabase URL
 * - trims spaces
 * - removes quotes
 * - removes trailing dots or slashes
 */
function normalizeUrl(v?: string) {
  if (!v) return "";
  return v
    .trim()
    .replace(/^"|"$|^'|'$/g, "")
    .replace(/\s+/g, "")
    .replace(/[\/.]+$/g, "");
}

/**
 * 🔐 Browser-safe Supabase client (ANON)
 * - Build-safe (no throw at import time)
 * - Returns null only if env is truly missing
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!supabaseUrl || !/^https?:\/\/.+/i.test(supabaseUrl) || !anonKey) {
    return null;
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * ✅ Backward-compatible exports
 * - Old code can keep using `supabase`
 * - TS error removed (non-null)
 */
export const supabase: SupabaseClient = (() => {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      "Supabase browser client is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return client;
})();

// Optional alias (agar kahin supabaseClient naam use ho raha ho)
export const supabaseClient = supabase;
