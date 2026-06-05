import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getEnv(name: string): string | null {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : null;
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getSupabaseAdminOrNull(): SupabaseClient | null {
  try {
    return getSupabaseAdmin();
  } catch (error) {
    console.error("Failed to initialize Supabase admin client:", error);
    return null;
  }
}

function createLazySupabaseAdmin(): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      const client = getSupabaseAdmin();

      const value = (client as any)[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
}

export const supabaseAdmin: SupabaseClient = createLazySupabaseAdmin();
export const supabaseAdminSafe: SupabaseClient = supabaseAdmin;

export function getSupabaseAdminSafe(): SupabaseClient {
  return supabaseAdminSafe;
}