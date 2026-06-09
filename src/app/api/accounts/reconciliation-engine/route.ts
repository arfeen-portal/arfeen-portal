import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

  const { data, error } = await supabase
    .from("reconciliation_engine")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ records: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

  const body = await req.json();

  const systemBalance = Number(body.system_balance || 0);
  const supplierBalance = Number(body.supplier_statement_balance || 0);
  const difference = systemBalance - supplierBalance;

  const payload = {
    supplier_name: body.supplier_name,
    system_balance: systemBalance,
    supplier_statement_balance: supplierBalance,
    matched_amount: difference === 0 ? systemBalance : 0,
    payment_mismatch_detected: difference !== 0,
    auto_discrepancy_detected: Math.abs(difference) > 0,
    discrepancy_reason: difference === 0 ? "Matched" : `Difference detected: ${difference}`,
    status: difference === 0 ? "matched" : "mismatch",
  };

  const { data, error } = await supabase
    .from("reconciliation_engine")
    .insert([payload])
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ record: data });
}