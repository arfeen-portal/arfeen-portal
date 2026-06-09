import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("umrah_visa_inventory")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
  }

  const body = await req.json();

  const payload = {
    supplier_name: body.supplier_name,
    visa_type: body.visa_type,
    nationality: body.nationality || null,
    cost_rate: Number(body.cost_rate || 0),
    currency: body.currency || "SAR",
    start_date: body.start_date,
    end_date: body.end_date,
    status: body.status || "active",
    notes: body.notes || null,
  };

  const { data, error } = await supabase
    .from("umrah_visa_inventory")
    .insert([payload])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}