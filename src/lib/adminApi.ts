import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export function jsonOk(data: any, init?: number) {
  return NextResponse.json({ ok: true, ...data }, { status: init || 200 });
}

export function jsonFail(message: string, init = 400, extra: any = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status: init });
}

export function getAdminClientOrFail() {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return null;
  return supabase;
}