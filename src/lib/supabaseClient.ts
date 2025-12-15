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

/**
 * ✅ Browser/client Supabase client (ANON) - BUILD SAFE
 * Never throws at module load; returns null if env missing/invalid.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!supabaseUrl || !/^https?:\/\/.+/i.test(supabaseUrl) || !anonKey) return null;

  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}

// Backward compatible export name (agar kahin purana import use ho raha ho)
export const supabaseClient = getSupabaseBrowserClient;
