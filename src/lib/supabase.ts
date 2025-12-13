import { createClient } from "@supabase/supabase-js";

let _admin: ReturnType<typeof createClient> | null = null;

function normalizeUrl(v?: string) {
  if (!v) return "";
  return v.trim().replace(/^"|"$/g, "").replace(/\/+$/, "");
}

export function getSupabaseAdminClient() {
  if (_admin) return _admin;

  const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey =
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || "").trim();

  if (!supabaseUrl) throw new Error("supabaseUrl is required");
  if (!/^https?:\/\/.+/i.test(supabaseUrl)) {
    throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL");
  }
  if (!serviceKey) throw new Error("supabase service role key is required");

  _admin = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return _admin;
}

export const createSupabaseAdminClient = getSupabaseAdminClient;
export const createAdminClient = getSupabaseAdminClient;
