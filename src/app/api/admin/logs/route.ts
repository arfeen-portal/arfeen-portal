import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  const { data } = await supabase!
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json(data);
}