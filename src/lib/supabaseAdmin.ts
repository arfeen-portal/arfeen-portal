import { createClient } from "@supabase/supabase-js";

/**
 * Runtime-safe Supabase admin client
 * ❌ Never create client at module load
 * ✅ Always create inside function
 */
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase env vars missing at runtime");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Backward compatibility (TEMP)
 * ⚠️ DO NOT USE IN NEW CODE
 */
export function createAdminClient() {
  return getSupabaseAdmin();
}
