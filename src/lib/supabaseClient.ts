import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * ✅ Client-side (use in "use client")
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

/**
 * ✅ Server-side (use in server components)
 */
export const getSupabaseClient = () => {
  return createClient(
    supabaseUrl,
    supabaseAnonKey
  );
};
