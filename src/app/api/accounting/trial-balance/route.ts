import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase admin client not configured", trialBalance: [] }, { status: 500 });
  }

  const { data, error } = await supabase.from("v_account_balances").select("*").limit(1000);

  if (error) {
    return NextResponse.json({ success: false, error: error.message, trialBalance: [] }, { status: 500 });
  }

  return NextResponse.json({ success: true, trialBalance: data ?? [] });
}
