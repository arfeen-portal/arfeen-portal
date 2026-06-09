import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function riskLevel(score: number) {
  if (score >= 75) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("ledger_anomaly_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const rows = Array.isArray(body?.rows) ? body.rows : [];

  if (rows.length === 0) {
    return NextResponse.json(
      { success: false, error: "No anomaly rows provided" },
      { status: 400 }
    );
  }

  const payload = rows.map((r: any) => ({
    account_id: r.account_id || null,
    voucher_id: r.voucher_id || null,
    ledger_line_id: String(r.id || r.ledger_line_id || ""),
    voucher_no: r.voucher_no || r.voucher_number || null,
    voucher_type: r.voucher_type || null,
    account_code: r.account_code || r.code || null,
    account_name: r.account_name || r.name || null,
    transaction_date: r.transaction_date || r.entry_date || r.voucher_date || r.date || null,
    debit: Number(r.debit) || 0,
    credit: Number(r.credit) || 0,
    running_balance: Number(r.runningBalance) || 0,
    anomaly_score: Number(r.anomalyScore) || 0,
    risk_level: riskLevel(Number(r.anomalyScore) || 0),
    anomaly_reasons: r.anomalyReasons || [],
    ai_decision: r.aiDecision || "AI anomaly detected from ledger analysis.",
    status: "open",
    source: "ledger_ai_widget",
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from("ledger_anomaly_logs")
    .upsert(payload, {
      onConflict: "ledger_line_id,source",
      ignoreDuplicates: false,
    })
    .select("*");

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    saved: data?.length ?? 0,
    data: data ?? [],
  });
}