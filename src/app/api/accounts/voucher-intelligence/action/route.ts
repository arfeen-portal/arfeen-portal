import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

  const body = await req.json();
  const { id, action, actor, note } = body;

  const { data: oldVoucher, error: oldError } = await supabase
    .from("voucher_intelligence")
    .select("*")
    .eq("id", id)
    .single();

  if (oldError || !oldVoucher) {
    return NextResponse.json({ error: oldError?.message || "Voucher not found" }, { status: 404 });
  }

  let updatePayload: any = {};

  if (action === "send_whatsapp") {
    updatePayload = {
      whatsapp_sent: true,
      whatsapp_sent_at: new Date().toISOString(),
      status: "sent",
    };
  }

  if (action === "verify_qr") {
    updatePayload = {
      qr_verified_count: Number(oldVoucher.qr_verified_count || 0) + 1,
      status: "verified",
    };
  }

  if (action === "revise") {
    const nextRevision = Number(oldVoucher.revision_no || 1) + 1;

    await supabase.from("voucher_revision_history").insert([{
      voucher_id: id,
      revision_no: nextRevision,
      previous_data: oldVoucher,
      changed_data: body.changed_data || {},
      changed_by: actor || "admin",
      note: note || "Voucher revised",
    }]);

    updatePayload = {
      revision_no: nextRevision,
      status: "revised",
      itinerary: body.itinerary || oldVoucher.itinerary,
    };
  }

  const { data, error } = await supabase
    .from("voucher_intelligence")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ voucher: data });
}