import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * ✅ Client-side Supabase
 * (ONLY for files with "use client")
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * ✅ Server-side Supabase
 * (ONLY for server components / pages)
 */
export function getSupabaseClient() {
  return createClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
