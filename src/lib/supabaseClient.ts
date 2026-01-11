import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ✅ client-side (ONLY for "use client")
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// ✅ server-side (ONLY for server pages)
export function getSupabaseClient() {
  return createClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
