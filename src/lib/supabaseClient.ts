import { createClient as createSupabaseClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 🔴 BUILD / PRERENDER SAFE GUARD
  if (!url || !anonKey) {
    console.warn(
      "Supabase client env missing during build — returning dummy client"
    );

    // dummy client → build will NOT crash
    return createSupabaseClient("http://localhost", "dummy-key");
  }

  _client = createSupabaseClient(url, anonKey);
  return _client;
}
