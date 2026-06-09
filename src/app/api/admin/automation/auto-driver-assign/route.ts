import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not configured" },
        { status: 500 }
      );
    }

    const { booking_id } = await req.json();

    if (!booking_id) {
      return NextResponse.json(
        { error: "booking_id is required" },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("transport_bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.pickup_lat || !booking.pickup_lng) {
      return NextResponse.json(
        { error: "Booking pickup_lat and pickup_lng required" },
        { status: 400 }
      );
    }

    const { data: drivers, error: driversError } = await supabase
      .from("drivers")
      .select("*")
      .eq("status", "available")
      .not("current_lat", "is", null)
      .not("current_lng", "is", null);

    if (driversError) {
      return NextResponse.json({ error: driversError.message }, { status: 500 });
    }

    if (!drivers?.length) {
      return NextResponse.json(
        { error: "No available driver found" },
        { status: 404 }
      );
    }

    const ranked = drivers
      .map((driver: any) => {
        const distance = distanceKm(
          Number(booking.pickup_lat),
          Number(booking.pickup_lng),
          Number(driver.current_lat),
          Number(driver.current_lng)
        );

        const vehicleMatch =
          !booking.vehicle_type ||
          !driver.vehicle_type ||
          String(booking.vehicle_type).toLowerCase() ===
            String(driver.vehicle_type).toLowerCase();

        const rating = Number(driver.rating || 5);
        const score = distance - rating * 0.25 + (vehicleMatch ? -2 : 5);

        return {
          driver,
          distance_km: Number(distance.toFixed(2)),
          decision_score: Number(score.toFixed(2)),
          vehicle_match: vehicleMatch,
        };
      })
      .sort((a, b) => a.decision_score - b.decision_score);

    const selected = ranked[0];

    const now = new Date().toISOString();

    const { error: updateBookingError } = await supabase
      .from("transport_bookings")
      .update({
        assigned_driver_id: selected.driver.id,
        driver_id: selected.driver.id,
        driver_assigned_at: now,
        assignment_method: "nearest_driver_auto",
        assignment_notes: `Auto assigned. Distance ${selected.distance_km} KM. Score ${selected.decision_score}.`,
        status: booking.status === "pending" ? "confirmed" : booking.status,
        updated_at: now,
      })
      .eq("id", booking_id);

    if (updateBookingError) {
      return NextResponse.json(
        { error: updateBookingError.message },
        { status: 500 }
      );
    }

    await supabase
      .from("drivers")
      .update({
        status: "busy",
        active_booking_id: booking_id,
        updated_at: now,
      })
      .eq("id", selected.driver.id);

    await supabase.from("driver_assignment_logs").insert([
      {
        booking_id,
        driver_id: selected.driver.id,
        distance_km: selected.distance_km,
        decision_score: selected.decision_score,
        status: "assigned",
        notes: "Nearest available driver assigned by automation engine",
      },
    ]);

    return NextResponse.json({
      success: true,
      selected_driver: selected.driver,
      ranked_drivers: ranked.slice(0, 5),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}