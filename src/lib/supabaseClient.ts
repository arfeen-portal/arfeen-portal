import { createClient } from "@supabase/supabase-js";

/**
 * ❌ DO NOT read env at module scope
 * ✅ Read env ONLY inside functions
 */

/* -------------------------------------------------
   CLIENT SIDE (use client components only)
-------------------------------------------------- */
export function getBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env vars missing (browser)");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

/* -------------------------------------------------
   SERVER SIDE (server components / pages)
-------------------------------------------------- */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env vars missing (server)");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
