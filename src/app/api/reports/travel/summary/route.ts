import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ReportRow = {
  total_bookings?: number | string | null;
  total_passengers?: number | string | null;
  gross_sales?: number | string | null;
};

function getDateRange(searchParams: URLSearchParams) {
  const to =
    searchParams.get("to") || new Date().toISOString().slice(0, 10);

  const fromDate = new Date(to);
  fromDate.setDate(fromDate.getDate() - 29);

  const from =
    searchParams.get("from") || fromDate.toISOString().slice(0, 10);

  return { from, to };
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

    const [
      topRoutesResult,
      vehicleBreakdownResult,
      statusBreakdownResult,
      hourlyDistributionResult,
    ] = await Promise.all([
      supabaseAdmin.rpc("report_top_routes", {
        p_from: from,
        p_to: to,
        p_limit: 10,
      }),
      supabaseAdmin.rpc("report_vehicle_breakdown", {
        p_from: from,
        p_to: to,
      }),
      supabaseAdmin.rpc("report_status_breakdown", {
        p_from: from,
        p_to: to,
      }),
      supabaseAdmin.rpc("report_hourly_distribution", {
        p_from: from,
        p_to: to,
      }),
    ]);

    const error =
      topRoutesResult.error ||
      vehicleBreakdownResult.error ||
      statusBreakdownResult.error ||
      hourlyDistributionResult.error;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const topRoutes = (topRoutesResult.data ?? []) as ReportRow[];
    const vehicleBreakdown = vehicleBreakdownResult.data ?? [];
    const statusBreakdown = statusBreakdownResult.data ?? [];
    const hourlyDistribution = hourlyDistributionResult.data ?? [];

    const routeCount = topRoutes.reduce(
      (sum: number, item: ReportRow) =>
        sum + Number(item.total_bookings ?? 0),
      0
    );

    const passengerCount = topRoutes.reduce(
      (sum: number, item: ReportRow) =>
        sum + Number(item.total_passengers ?? 0),
      0
    );

    const grossSales = topRoutes.reduce(
      (sum: number, item: ReportRow) =>
        sum + Number(item.gross_sales ?? 0),
      0
    );

    return NextResponse.json({
      ok: true,
      filters: { from, to },
      kpis: {
        routeBookings: routeCount,
        routePassengers: passengerCount,
        routeGrossSales: grossSales.toFixed(2),
        activeVehicles: Array.isArray(vehicleBreakdown)
          ? vehicleBreakdown.length
          : 0,
      },
      topRoutes,
      vehicleBreakdown,
      statusBreakdown,
      hourlyDistribution,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}