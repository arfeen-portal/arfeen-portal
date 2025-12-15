// src/lib/supabase.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function normalizeUrl(v?: string) {
  if (!v) return "";
  return v
    .trim()
    .replace(/^"|"$|^'|'$/g, "")
    .replace(/\s+/g, "")
    .replace(/[\/.]+$/g, "");
}

function isValidHttpUrl(v: string) {
  return /^https?:\/\/.+/i.test(v);
}

// ---------- Server (Admin / Service Role) ----------
export function createAdminClient(): SupabaseClient | null {
  const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl || !isValidHttpUrl(supabaseUrl) || !serviceKey) return null;

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export const createSupabaseAdminClient = createAdminClient;

// ---------- Server (Anon) ----------
export function createSupabaseServerClient(): SupabaseClient | null {
  const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  if (!supabaseUrl || !isValidHttpUrl(supabaseUrl) || !anonKey) return null;

  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
