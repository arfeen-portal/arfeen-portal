// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

function mustGetEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/**
 * Server-side Supabase client (Service Role).
 * Use ONLY in server code (API routes / server actions).
 */
export function createSupabaseServerClient() {
  const url = mustGetEnv("NEXT_PUBLIC_SUPABASE_URL");
  // Prefer SERVICE_ROLE if you use it; fallback to SUPABASE_SERVICE_ROLE_KEY if that’s what you set
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    "";

  if (!serviceKey) {
    throw new Error(
      "Missing env: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE)"
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Backward-compatible alias (agar project me kahin aur use ho raha ho)
 */
export const createSupabaseAdminClient = createSupabaseServerClient;
