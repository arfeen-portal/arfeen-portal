import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Safe env getter (build + runtime)
 */
function getEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

/**
 * Server-only Supabase ADMIN client (Service Role)
 * - Object export (NOT a function)
 * - Build-time safe
 * - Runtime safe
 */
const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

export const supabaseAdmin: SupabaseClient | null =
  url && serviceKey
    ? createClient(url, serviceKey, {
        auth: {
          persistSession: false,
        },
      })
    : null;

/**
 * Backward compatibility (temporary)
 * NOTE: isko function ki tarah CALL nahi karna
 */
export const supabaseAdminSafe = supabaseAdmin;
