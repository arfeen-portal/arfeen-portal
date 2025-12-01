// src/utils/supabase/server.ts
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createSupabaseClient(url, anonKey);
}

// agar kahin aur "createClient" use ho raha ho to us ke liye bhi alias:
export const createClient = createServerSupabaseClient;
