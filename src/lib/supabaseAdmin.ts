// DEBUG: build #1 – line added on <today>
// src/lib/supabaseAdmin.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// Old name for backward compatibility
export function createAdminClient() {
  return supabaseAdmin;
}
