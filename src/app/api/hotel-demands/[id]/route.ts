import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("hotel_demands")
    .select(`
      *,
      hotel_supplier_rfq(*),
      hotel_booking_confirmations(*),
      hotel_hcn_reminders(*),
      hotel_demand_audit_logs(*)
    `)
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
  }

  const body = await req.json();

  const { data, error } = await supabase
    .from("hotel_demands")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("hotel_demand_audit_logs").insert([
    {
      demand_id: params.id,
      action: "DEMAND_UPDATED",
      description: "Hotel demand updated.",
      actor: "admin",
      metadata: body,
    },
  ]);

  return NextResponse.json({ data });
}