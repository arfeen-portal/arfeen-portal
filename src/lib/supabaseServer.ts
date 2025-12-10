import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server only

// NEW helper jo hum ne AI modules ke liye use kia
export function getSupabaseServerClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase env vars missing');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });
}

// 🔁 COMPATIBLE naam (takay purane code bhi chal jaayen)
export function createSupabaseServerClient() {
  return getSupabaseServerClient();
}
