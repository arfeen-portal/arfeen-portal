import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getDateRange(searchParams: URLSearchParams) {
  const to = searchParams.get("to") || new Date().toISOString().slice(0, 10);

  const fromDate = new Date(to);
  fromDate.setDate(fromDate.getDate() - 29);
  const from = searchParams.get("from") || fromDate.toISOString().slice(0, 10);

  return { from, to };
}

export async function GET(req: NextRequest) {
  try {
    const { from, to } = getDateRange(req.nextUrl.searchParams);
    const supabaseAdmin = getSupabaseAdmin();

    const [
      { data: kpis, error: kpiError },
      { data: daily, error: dailyError },
      { data: topAgents, error: agentsError },
    ] = await Promise.all([
      supabaseAdmin.rpc("report_financial_kpis", { p_from: from, p_to: to }),
      supabaseAdmin.rpc("report_sales_summary", { p_from: from, p_to: to }),
      supabaseAdmin.rpc("report_top_agents", { p_from: from, p_to: to, p_limit: 10 }),
    ]);

    const error = kpiError || dailyError || agentsError;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      filters: { from, to },
      kpis: (kpis && kpis[0]) || null,
      daily: daily || [],
      topAgents: topAgents || [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}