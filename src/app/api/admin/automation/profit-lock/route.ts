import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("profit_lock_rules")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rules: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const product_type = body.product_type || "transport";
    const sale_amount = Number(body.sale_amount || 0);
    const cost_amount = Number(body.cost_amount || 0);
    const booking_id = body.booking_id || null;

    const profit_amount = sale_amount - cost_amount;
    const margin_percent =
      sale_amount > 0 ? Number(((profit_amount / sale_amount) * 100).toFixed(2)) : 0;

    const { data: rules, error } = await supabase
      .from("profit_lock_rules")
      .select("*")
      .eq("product_type", product_type)
      .eq("is_active", true)
      .limit(1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rule = rules?.[0];

    if (!rule) {
      return NextResponse.json({
        success: true,
        decision: "allowed",
        notes: "No active rule found",
      });
    }

    const required = Number(rule.minimum_margin_value);

    const passed =
      rule.minimum_margin_type === "percent"
        ? margin_percent >= required
        : profit_amount >= required;

    const decision = passed
      ? "allowed"
      : rule.action === "reject"
        ? "rejected"
        : "warning";

    await supabase.from("profit_lock_logs").insert([
      {
        booking_id,
        product_type,
        sale_amount,
        cost_amount,
        profit_amount,
        margin_percent,
        required_margin: required,
        decision,
        notes: passed
          ? "Profit lock passed"
          : `Profit below required ${rule.minimum_margin_type}: ${required}`,
      },
    ]);

    if (booking_id) {
      await supabase
        .from("transport_bookings")
        .update({
          profit_lock_status: decision,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking_id);
    }

    return NextResponse.json({
      success: true,
      decision,
      product_type,
      sale_amount,
      cost_amount,
      profit_amount,
      margin_percent,
      required_margin: required,
      rule,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}