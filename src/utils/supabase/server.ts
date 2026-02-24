// src/utils/supabase/server.ts
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client
 * - NO next/headers
 * - NO cookies
 * - Safe for route.ts and server utilities
 */
export function getSupabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return createClient(url, anonKey);
}

/**
 * Optional alias for backward compatibility
 * (agar kahin `createClient` naam se import ho raha ho)
 */
export const createClientServer = getSupabaseServerClient;
