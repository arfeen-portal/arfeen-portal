import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseServerClient(): AppSupabaseClient | null {
  try {
    const env = getSupabaseEnv();
    if (!env) return null;

    const cookieStore = cookies();

    return createServerClient(env.url, env.anonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {
          // no-op in read contexts
        },
        remove() {
          // no-op in read contexts
        },
      },
    });
  } catch {
    return null;
  }
}

export function createSupabaseServerClient(): AppSupabaseClient | null {
  return getSupabaseServerClient();
}