import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenant_id");

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenant_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("v_account_balances")
      .select("*")
      .eq("tenant_id", tenantId);

    if (error) {
      throw error;
    }

    const rows = data || [];

    const assets = rows.filter((r: any) =>
      ["asset", "assets"].includes(String(r.account_type || "").toLowerCase())
    );

    const liabilities = rows.filter((r: any) =>
      ["liability", "liabilities"].includes(String(r.account_type || "").toLowerCase())
    );

    const equity = rows.filter((r: any) =>
      ["equity"].includes(String(r.account_type || "").toLowerCase())
    );

    const totalAssets = assets.reduce(
      (sum: number, row: any) => sum + Number(row.balance || 0),
      0
    );

    const totalLiabilities = liabilities.reduce(
      (sum: number, row: any) => sum + Number(row.balance || 0),
      0
    );

    const totalEquity = equity.reduce(
      (sum: number, row: any) => sum + Number(row.balance || 0),
      0
    );

    return NextResponse.json({
      success: true,
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      balanced:
        Number(totalAssets.toFixed(2)) ===
        Number((totalLiabilities + totalEquity).toFixed(2)),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch balance sheet" },
      { status: 500 }
    );
  }
}