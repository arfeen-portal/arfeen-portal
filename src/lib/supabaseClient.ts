// src/lib/supabaseClient.ts
import { createClient as supaCreateClient, type SupabaseClient } from "@supabase/supabase-js";

function normalizeUrl(v?: string) {
  if (!v) return "";
  return v
    .trim()
    .replace(/^"|"$|^'|'$/g, "")
    .replace(/\s+/g, "")
    .replace(/[\/.]+$/g, "");
}

let _client: SupabaseClient | null = null;

/**
 * ✅ SAFE: returns SupabaseClient or null (never throws at import time)
 */
export function createClient(): SupabaseClient | null {
  if (_client) return _client;

  const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!supabaseUrl || !/^https?:\/\/.+/i.test(supabaseUrl) || !anonKey) return null;

  _client = supaCreateClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _client;
}

/**
 * ✅ Backward compatible exports
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const client = createClient();
    if (!client) {
      throw new Error(
        "Supabase client not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel."
      );
    }
    return Reflect.get(client as any, prop, receiver);
  },
});

export const supabaseClient = supabase;
