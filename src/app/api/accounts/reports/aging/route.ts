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
      .from("v_invoice_aging")
      .select("*")
      .eq("tenant_id", tenantId)
      .gt("balance_amount", 0)
      .order("due_date", { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      rows: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch aging report" },
      { status: 500 }
    );
  }
}