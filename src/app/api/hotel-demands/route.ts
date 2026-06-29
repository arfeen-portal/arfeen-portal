import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { sanitizeDemandsForAgent } from "@/lib/hotels/demandVisibility";
import { validateHotelDemandInput } from "@/lib/hotels/rfqValidation";

export const dynamic = "force-dynamic";

const OPS_ROLES = new Set(["super_admin", "admin", "operations"]);

async function getSessionContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle<{ role: string | null; name: string | null; email: string | null }>();

  return { user, profile };
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function estimateMarketPrice(city: string, hotel: string, roomType: string, urgency: string) {
  let base = 280;

  if (city.toLowerCase().includes("makkah")) base += 60;
  if (city.toLowerCase().includes("madinah")) base += 35;
  if (hotel.toLowerCase().includes("swiss")) base += 120;
  if (hotel.toLowerCase().includes("fairmont")) base += 150;
  if (roomType.toLowerCase().includes("double")) base += 80;
  if (urgency === "high" || urgency === "urgent") base += 40;

  return base;
}

function detectRisk(checkIn: string, urgency: string) {
  const today = new Date();
  const date = new Date(`${checkIn}T00:00:00Z`);
  const days = Math.ceil((date.getTime() - today.getTime()) / 86400000);

  if (days <= 1) return "critical";
  if (urgency === "urgent") return "high";
  if (days <= 3) return "high";
  return "normal";
}

export async function GET() {
  const session = await getSessionContext();

  if (!session?.profile?.role) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const role = session.profile.role;
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
  }

  let query = supabase
    .from("hotel_demands")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (role === "agent") {
    const agentName = (session.profile.name || "").trim();
    if (agentName) {
      query = query.ilike("agent_name", `%${agentName}%`);
    } else {
      query = query.eq("agent_id", session.user.id);
    }
  } else if (!OPS_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];

  if (role === "agent") {
    return NextResponse.json({ data: sanitizeDemandsForAgent(rows) });
  }

  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
  }

  const body = await req.json();
  const session = await getSessionContext();

  const rooms = Math.max(1, toNumber(body.rooms, 1));
  const pax = Math.max(1, toNumber(body.pax, 1));
  const roomType = String(body.room_type || "").trim();
  const checkIn = String(body.check_in || "").trim();
  const checkOut = String(body.check_out || "").trim();

  const validation = validateHotelDemandInput({
    guest_name: body.guest_name,
    hotel: body.hotel,
    check_in: checkIn,
    check_out: checkOut,
    room_type: roomType,
    rooms,
    pax,
  });

  if (!validation.ok) {
    const message =
      validation.error.includes("maximum") || validation.error.includes("guest")
        ? "Requested pax exceeds selected room capacity."
        : validation.error;

    return NextResponse.json({ error: message }, { status: 400 });
  }

  const urgency = String(body.urgency || "normal");
  const expectedMarketPrice = estimateMarketPrice(
    String(body.city ?? ""),
    String(body.hotel ?? ""),
    roomType,
    urgency
  );
  const riskLevel = detectRisk(checkIn, urgency);

  const duplicateQuery = await supabase
    .from("hotel_demands")
    .select("id")
    .eq("guest_name", body.guest_name)
    .eq("hotel", body.hotel)
    .eq("check_in", checkIn)
    .limit(1);

  const duplicateScore = duplicateQuery.data?.length ? 95 : 0;

  const agentName = String(body.agent_name || session?.profile?.name || "").trim() || null;
  const agentId =
    session?.profile?.role === "agent" ? session.user.id : body.agent_id || null;

  const insertPayload = {
    agent_id: agentId,
    agent_name: agentName,
    guest_name: String(body.guest_name).trim(),
    city: String(body.city || "Makkah").trim(),
    hotel: String(body.hotel).trim(),
    check_in: checkIn,
    check_out: checkOut,
    nights: validation.nights,
    room_type: roomType,
    room_capacity: validation.roomCapacity,
    rooms,
    pax,
    meal_plan: String(body.meal_plan || "RO").trim(),
    budget: toNumber(body.budget, 0),
    urgency,
    notes: body.notes ? String(body.notes).trim() : null,
    duplicate_score: duplicateScore,
    expected_market_price: expectedMarketPrice,
    risk_level: riskLevel,
    crowd_pressure: riskLevel === "critical" ? "very_high" : riskLevel === "high" ? "high" : "normal",
    status: "rfq_pending",
    quote_status: "awaiting_supplier",
    hcn_status: "pending",
  };

  const { data, error } = await supabase
    .from("hotel_demands")
    .insert([insertPayload])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("hotel_demand_audit_logs").insert([
    {
      demand_id: data.id,
      action: "DEMAND_CREATED",
      description: "Offline hotel demand created.",
      actor: session?.user?.email || "public",
      metadata: {
        nights: validation.nights,
        roomCapacity: validation.roomCapacity,
      },
    },
  ]);

  const suppliers = [
    {
      demand_id: data.id,
      supplier_name: "Makkah Premium Hotel Supplier",
      whatsapp_group: "Makkah 5 Star Hotels",
      city_specialization: data.city,
      hotel_specialization: data.hotel,
      routing_score: 94,
      confirmation_reliability: 91,
      cancellation_ratio: 3,
      fake_availability_ratio: 2,
    },
    {
      demand_id: data.id,
      supplier_name: "Saudi Hotel Desk",
      whatsapp_group: "Saudi Hotel RFQ Desk",
      city_specialization: data.city,
      hotel_specialization: "Multiple",
      routing_score: 87,
      confirmation_reliability: 86,
      cancellation_ratio: 6,
      fake_availability_ratio: 4,
    },
  ];

  await supabase.from("hotel_supplier_rfq").insert(suppliers);

  return NextResponse.json({ data: sanitizeDemandsForAgent([data])[0] ?? data });
}
