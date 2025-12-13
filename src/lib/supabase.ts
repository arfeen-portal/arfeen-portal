// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

let _server: ReturnType<typeof createClient> | null = null;

function normalizeUrl(v?: string) {
  if (!v) return "";
  return v.trim().replace(/^"|"$/g, "").replace(/\/+$/, "");
}

/**
 * Server-side Supabase client (Service Role)
 * IMPORTANT: no throws at module load; only when called.
 */
export function createSupabaseServerClient() {
  if (_server) return _server;

  const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);

  const serviceKey =
    (process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE ||
      "").trim();

  if (!supabaseUrl) throw new Error("supabaseUrl is required");
  if (!/^https?:\/\/.+/i.test(supabaseUrl)) {
    throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL");
  }
  if (!serviceKey) throw new Error("supabase service role key is required");

  _server = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _server;
}

// Backward-compatible aliases (agar kahin aur use ho rahe hon)
export const createSupabaseAdminClient = createSupabaseServerClient;
export const createAdminClient = createSupabaseServerClient;
