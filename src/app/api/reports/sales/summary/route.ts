import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SalesSummaryRow = {
  total_bookings?: number | string | null;
  confirmed_bookings?: number | string | null;
  cancelled_bookings?: number | string | null;
  total_passengers?: number | string | null;
  gross_sales?: number | string | null;
  total_commission?: number | string | null;
  net_sales?: number | string | null;
};

function getDateRange(searchParams: URLSearchParams) {
  const to = searchParams.get("to") || new Date().toISOString().slice(0, 10);

  const fromDate = new Date(to);
  fromDate.setDate(fromDate.getDate() - 29);

  const from = searchParams.get("from") || fromDate.toISOString().slice(0, 10);

  return { from, to };
}

function money(value: number) {
  return Number(value || 0).toFixed(2);
}

export async function GET(req: NextRequest) {
  try {
    const { from, to } = getDateRange(req.nextUrl.searchParams);
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured" },
        { status: 500 }
      );
    }

    const [{ data: daily, error: dailyError }, { data: topAgents, error: agentsError }] =
      await Promise.all([
        supabaseAdmin.rpc("report_sales_summary", {
          p_from: from,
          p_to: to,
        }),
        supabaseAdmin.rpc("report_top_agents", {
          p_from: from,
          p_to: to,
          p_limit: 10,
        }),
      ]);

    if (dailyError) {
      return NextResponse.json({ error: dailyError.message }, { status: 500 });
    }

    if (agentsError) {
      return NextResponse.json({ error: agentsError.message }, { status: 500 });
    }

    const rows = (daily ?? []) as SalesSummaryRow[];

    const totals = rows.reduce(
      (acc, row) => {
        acc.totalBookings += Number(row.total_bookings ?? 0);
        acc.confirmedBookings += Number(row.confirmed_bookings ?? 0);
        acc.cancelledBookings += Number(row.cancelled_bookings ?? 0);
        acc.totalPassengers += Number(row.total_passengers ?? 0);
        acc.grossSales += Number(row.gross_sales ?? 0);
        acc.totalCommission += Number(row.total_commission ?? 0);
        acc.netSales += Number(row.net_sales ?? 0);
        return acc;
      },
      {
        totalBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        totalPassengers: 0,
        grossSales: 0,
        totalCommission: 0,
        netSales: 0,
      }
    );

    const avgBookingValue =
      totals.totalBookings > 0 ? totals.grossSales / totals.totalBookings : 0;

    return NextResponse.json({
      ok: true,
      filters: { from, to },
      kpis: {
        totalBookings: totals.totalBookings,
        confirmedBookings: totals.confirmedBookings,
        cancelledBookings: totals.cancelledBookings,
        totalPassengers: totals.totalPassengers,
        grossSales: money(totals.grossSales),
        totalCommission: money(totals.totalCommission),
        netSales: money(totals.netSales),
        avgBookingValue: money(avgBookingValue),
      },
      daily: rows,
      topAgents: topAgents ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}