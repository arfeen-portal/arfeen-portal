// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function normalizeUrl(v?: string) {
  if (!v) return "";
  return v.trim().replace(/^"|"$|^'|'$/g, "").replace(/\+$/g, "");
}

/**
 * ✅ Admin (Service Role) client - BUILD SAFE
 * Never throws at module load; returns null if env missing/invalid.
 */
export function getSupabaseAdminSafe(): SupabaseClient | null {
  const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || !/^https?:\/\/.+/i.test(supabaseUrl) || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/**
 * ✅ Server (ANON) client - BUILD SAFE
 * Never throws at module load; returns null if env missing/invalid.
 */
export function getSupabaseServerSafe(): SupabaseClient | null {
  const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!supabaseUrl || !/^https?:\/\/.+/i.test(supabaseUrl) || !anonKey) return null;

  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

// ✅ Backward compatible aliases (taake purana code na tootay)
export const createSupabaseAdminClient = getSupabaseAdminSafe;
export const createAdminClient = getSupabaseAdminSafe;
export const createSupabaseServerClient = getSupabaseServerSafe;
