import { createClient } from "@supabase/supabase-js";

/**
 * Safe env getter (build-time friendly)
 */
function getEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.length > 0 ? v : null;
}

/**
 * ✅ Server-only Supabase client
 * ✅ Build-safe (never throws during build)
 */
export function getSupabaseServerClient() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  // ❗ build time pe error throw nahi karna
  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * ✅ Backward compatibility
 * (tumhare purane imports break na hon)
 */
export function createSupabaseServerClient() {
  return getSupabaseServerClient();
}
