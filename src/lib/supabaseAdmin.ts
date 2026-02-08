import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Build-safe env getter
 */
function getEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

/**
 * 🔐 Server-only Supabase ADMIN client
 * ✅ Build-time SAFE
 * ✅ Runtime SAFE
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  // ⛔ CRITICAL: build-time par yahin STOP
  if (!url || !serviceKey) {
    // ⚠️ DO NOT call createClient here
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * 🔁 Backward compatibility
 */
export const getSupabaseAdmin = getSupabaseAdminClient;
