import { createClient } from "@supabase/supabase-js";

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

/**
 * Server-only Supabase client
 * NEVER returns null
 * Fails fast with clear error
 */
export function createSupabaseServerClient() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error("Missing Supabase service/anon key");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
