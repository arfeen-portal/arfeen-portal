import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseAdmin,
  getSupabaseAdminSafe,
  getSupabaseAdminOrNull,
  supabaseAdmin,
  supabaseAdminSafe,
} from "./supabaseAdmin";

export {
  getSupabaseAdmin,
  getSupabaseAdminSafe,
  getSupabaseAdminOrNull,
  supabaseAdmin,
  supabaseAdminSafe,
};

export function getSupabaseAdminStrict(): SupabaseClient {
  return getSupabaseAdmin();
}