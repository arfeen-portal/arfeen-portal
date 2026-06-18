import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdminSafe } from "@/lib/supabaseAdminSafe";
export const dynamic = "force-dynamic";

type AuthorizedUser = {
  role: "super_admin" | "admin" | "operations";
  tenantId: string | null;
};

async function requireTransportAssigner() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("tenant_id, role")
    .eq("email", user.email.toLowerCase())
    .maybeSingle<{ tenant_id: string | null; role: string | null }>();

  if (profileError || !profile?.role) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (
    profile.role !== "super_admin" &&
    profile.role !== "admin" &&
    profile.role !== "operations"
  ) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  if (profile.role !== "super_admin" && !profile.tenant_id) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Tenant not assigned to this user." }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    user: {
      role: profile.role,
      tenantId: profile.tenant_id ?? null,
    } as AuthorizedUser,
  };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireTransportAssigner();
    if (!auth.ok) return auth.response;

    const { booking_id, driver_id, vehicle_id } = await req.json();
    const supabase = supabaseAdminSafe;

    const { data: booking, error: bookingError } = await supabase
      .from("transport_bookings")
      .select("id, tenant_id")
      .eq("id", booking_id)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const bookingTenantId = booking.tenant_id ?? null;

    if (auth.user.role !== "super_admin" && bookingTenantId !== auth.user.tenantId) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const { data: driver, error: driverError } = await supabase
      .from("transport_drivers")
      .select("id, tenant_id")
      .eq("id", driver_id)
      .maybeSingle();

    if (driverError || !driver || (driver.tenant_id ?? null) !== bookingTenantId) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    if (vehicle_id) {
      const { data: vehicle, error: vehicleError } = await supabase
        .from("transport_vehicles")
        .select("id, tenant_id")
        .eq("id", vehicle_id)
        .maybeSingle();

      if (vehicleError || !vehicle || (vehicle.tenant_id ?? null) !== bookingTenantId) {
        return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
      }
    }

    let updateQuery = supabase
      .from("transport_bookings")
      .update({
        driver_id,
        vehicle_id,
        status: "assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking_id);

    if (auth.user.role !== "super_admin") {
      updateQuery = updateQuery.eq("tenant_id", auth.user.tenantId);
    }

    const { data, error } = await updateQuery
      .select()
      .single();

    if (error) {
      console.error("assign-driver error", error);
      return NextResponse.json(
        { error: "Failed to assign driver", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ booking: data });
  } catch (err: any) {
    console.error("assign-driver exception", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
