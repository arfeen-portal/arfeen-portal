import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// ✅ client-side
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// ✅ server-side
export function getSupabaseClient() {
  return createClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
