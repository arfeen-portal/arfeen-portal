// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// Ye values Vercel / .env se aayengi
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

/**
 * Server-side Supabase client
 * API routes, server components, actions waghera ke liye.
 */
export function createSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Agar kahin client side ke liye chahiye ho to ye use kar sakte ho
 */
export function createSupabaseBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
