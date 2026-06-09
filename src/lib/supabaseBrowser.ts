import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AppSupabaseClient = SupabaseClient<any, "public", any>;

let browserClient: AppSupabaseClient | null = null;

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseBrowserClient(): AppSupabaseClient | null {
  if (browserClient) return browserClient;

  const env = getSupabaseEnv();
  if (!env) return null;

  browserClient = createClient(env.url, env.anonKey);
  return browserClient;
}

export const supabaseBrowser = getSupabaseBrowserClient();