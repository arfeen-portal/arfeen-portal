import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not initialized" }, { status: 500 });
  }

  const url = new URL(req.url);
  const agentId = url.searchParams.get("agentId");

  // If agentId provided: single agent summary
  if (agentId) {
    const { data, error } = await supabase
      .from("transport_bookings")
      .select("total_price, agent_commission")
      .eq("agent_id", agentId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to load wallet summary", details: error.message },
        { status: 500 }
      );
    }

    const rows = data ?? [];
    const totalSales = rows.reduce((s, r) => s + (Number(r.total_price) || 0), 0);
    const totalCommission = rows.reduce((s, r) => s + (Number(r.agent_commission) || 0), 0);

    return NextResponse.json({
      agentId,
      totalSales,
      totalCommission,
      bookingCount: rows.length,
    });
  }

  // Otherwise: all agents grouped summary (client-side grouping)
  const { data, error } = await supabase
    .from("transport_bookings")
    .select("agent_id, agent_name, agent_code, total_price, agent_commission");

  if (error) {
    return NextResponse.json(
      { error: "Failed to load wallet summary", details: error.message },
      { status: 500 }
    );
  }

  const map = new Map<
    string,
    { agent_id: string; agent_name: string | null; agent_code: string | null; totalSales: number; totalCommission: number; bookingCount: number }
  >();

  for (const r of data ?? []) {
    const id = String(r.agent_id ?? "");
    if (!id) continue;

    const current =
      map.get(id) ??
      {
        agent_id: id,
        agent_name: r.agent_name ?? null,
        agent_code: r.agent_code ?? null,
        totalSales: 0,
        totalCommission: 0,
        bookingCount: 0,
      };

    current.totalSales += Number(r.total_price) || 0;
    current.totalCommission += Number(r.agent_commission) || 0;
    current.bookingCount += 1;

    map.set(id, current);
  }

  return NextResponse.json({ agents: Array.from(map.values()) });
}