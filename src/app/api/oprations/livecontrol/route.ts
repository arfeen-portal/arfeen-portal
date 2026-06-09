import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfTodayISO() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

async function safeSelect(
  supabase: any,
  table: string,
  columns = "*",
  limit = 500
): Promise<AnyRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

async function safeCount(
  supabase: any,
  table: string,
  filter?: (q: any) => any
): Promise<number> {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error) return 0;
  return count || 0;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 }
      );
    }

    const todayStart = startOfTodayISO();
    const todayEnd = endOfTodayISO();

    const bookings = await safeSelect(supabase, "transport_bookings", "*", 800);
    const drivers = await safeSelect(supabase, "drivers", "*", 300);
    const autoSystems = await safeSelect(
      supabase,
      "operations_auto_systems",
      "*",
      100
    );
    const events = await safeSelect(
      supabase,
      "operations_control_events",
      "*",
      100
    );

    const todayBookings = bookings.filter((b) => {
      const t = b.pickup_time || b.created_at;
      return t >= todayStart && t <= todayEnd;
    });

    const arrivals = todayBookings.filter((b) =>
      String(b.dropoff_city || b.dropoff_location || "")
        .toLowerCase()
        .match(/airport|hotel|makkah|madinah|jeddah/)
    );

    const departures = todayBookings.filter((b) =>
      String(b.pickup_location || b.pickup_city || "")
        .toLowerCase()
        .match(/hotel|makkah|madinah|airport/)
    );

    const delayedTransport = bookings.filter((b) => {
      const status = String(b.status || "").toLowerCase();
      const pickup = b.pickup_time ? new Date(b.pickup_time).getTime() : 0;
      return (
        status.includes("delay") ||
        status.includes("pending") ||
        (pickup > 0 && pickup < Date.now() && !status.includes("complete"))
      );
    });

    const vipPassengers = bookings.filter((b) => {
      const notes = String(b.notes || "").toLowerCase();
      const vehicle = String(b.vehicle_type || "").toLowerCase();
      return (
        notes.includes("vip") ||
        notes.includes("v.i.p") ||
        vehicle.includes("vip") ||
        vehicle.includes("gmc") ||
        vehicle.includes("luxury")
      );
    });

    const activeDrivers = drivers.filter((d) => {
      const status = String(d.status || d.is_active || "").toLowerCase();
      return status === "active" || status === "true" || d.is_active === true;
    });

    const pendingPayments =
      (await safeCount(supabase, "finance_vouchers", (q) =>
        q.eq("status", "pending")
      )) ||
      bookings.filter((b) => {
        const status = String(b.payment_status || b.status || "").toLowerCase();
        return status.includes("pending") || status.includes("unpaid");
      }).length;

    const liveSales = todayBookings.reduce((sum, b) => {
      const amount =
        Number(b.total_price || 0) ||
        Number(b.total_amount || 0) ||
        Number(b.sale_amount || 0);
      return sum + amount;
    }, 0);

    const hotelOccupancy = await safeCount(supabase, "hotel_bookings", (q) =>
      q.gte("created_at", todayStart).lte("created_at", todayEnd)
    );

    const lowProfitBookings = bookings.filter((b) => {
      const sale = Number(b.total_price || 0);
      const cost =
        Number(b.base_fare || 0) +
        Number(b.driver_cost || 0) +
        Number(b.supplier_cost || 0);
      if (!sale || !cost) return false;
      const margin = ((sale - cost) / sale) * 100;
      return margin < 10;
    });

    return NextResponse.json({
      ok: true,
      generated_at: new Date().toISOString(),
      stats: {
        all_arrivals: arrivals.length,
        all_departures: departures.length,
        delayed_transport: delayedTransport.length,
        vip_passengers: vipPassengers.length,
        hotel_occupancy: hotelOccupancy,
        active_drivers: activeDrivers.length,
        pending_payments: pendingPayments,
        live_sales: liveSales,
        low_profit_alerts: lowProfitBookings.length,
      },
      lists: {
        arrivals: arrivals.slice(0, 12),
        departures: departures.slice(0, 12),
        delayed_transport: delayedTransport.slice(0, 12),
        vip_passengers: vipPassengers.slice(0, 12),
        active_drivers: activeDrivers.slice(0, 12),
        low_profit_bookings: lowProfitBookings.slice(0, 12),
        events: events.slice(0, 12),
      },
      auto_systems: autoSystems,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const action = body?.action;
    const system_key = body?.system_key;

    if (!system_key) {
      return NextResponse.json(
        { error: "system_key is required." },
        { status: 400 }
      );
    }

    if (action === "toggle") {
      const { data: current } = await supabase
        .from("operations_auto_systems")
        .select("is_enabled")
        .eq("system_key", system_key)
        .maybeSingle();

      const nextValue = !current?.is_enabled;

      const { error } = await supabase
        .from("operations_auto_systems")
        .update({
          is_enabled: nextValue,
          updated_at: new Date().toISOString(),
        })
        .eq("system_key", system_key);

      if (error) throw error;

      return NextResponse.json({ ok: true, system_key, is_enabled: nextValue });
    }

    if (action === "run_now") {
      const { error } = await supabase
        .from("operations_auto_systems")
        .update({
          last_run_at: new Date().toISOString(),
          last_status: "success",
          total_runs: body?.total_runs ? Number(body.total_runs) + 1 : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq("system_key", system_key);

      if (error) throw error;

      await supabase.from("operations_control_events").insert([
        {
          event_type: "automation_run",
          title: `Automation executed: ${system_key}`,
          description: "Manual run triggered from Operations Live Control.",
          priority: "normal",
          status: "open",
          metadata: { system_key, action },
        },
      ]);

      return NextResponse.json({ ok: true, system_key, status: "success" });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}