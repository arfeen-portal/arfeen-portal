import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

  const { data, error } = await supabase
    .from("accounting_period_locks")
    .select("*")
    .order("period_start", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ periods: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

  const body = await req.json();

  const payload = {
    period_type: body.period_type,
    period_start: body.period_start,
    period_end: body.period_end,
    status: body.status || "locked",
    closed_by: body.closed_by || "admin",
    closed_at: new Date().toISOString(),
    notes: body.notes || null,
  };

  const { data, error } = await supabase
    .from("accounting_period_locks")
    .upsert([payload], { onConflict: "period_type,period_start,period_end" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ period: data });
}