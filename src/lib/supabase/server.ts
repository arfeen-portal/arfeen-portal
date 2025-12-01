// src/lib/supabase/server.ts
import { createServerSupabaseClient } from "@/utils/supabase/server";

// APIs ke liye simple wrapper
export function createClient() {
  return createServerSupabaseClient();
}
