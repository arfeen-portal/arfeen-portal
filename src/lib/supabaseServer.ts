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

export async function createSupabaseServerClient(): Promise<AppSupabaseClient | null> {
  try {
    const env = getSupabaseEnv();
    if (!env) return null;

    const cookieStore = await cookies();

    return createServerClient(env.url, env.anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // ignore in read-only server component contexts
          }
        },
      },
    });
  } catch {
    return null;
  }
}

export async function getSupabaseServerClient(): Promise<AppSupabaseClient | null> {
  return createSupabaseServerClient();
}