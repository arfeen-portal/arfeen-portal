import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function calculateNights(checkIn: string, checkOut: string) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  return diff > 0 ? diff : 1;
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
  const date = new Date(checkIn);
  const days = Math.ceil((date.getTime() - today.getTime()) / 86400000);

  if (days <= 1) return "critical";
  if (urgency === "urgent") return "high";
  if (days <= 3) return "high";
  return "normal";
}

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("hotel_demands")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
  }

  const body = await req.json();

  const nights = calculateNights(body.check_in, body.check_out);
  const expectedMarketPrice = estimateMarketPrice(
    body.city ?? "",
    body.hotel ?? "",
    body.room_type ?? "",
    body.urgency ?? "normal"
  );

  const riskLevel = detectRisk(body.check_in, body.urgency ?? "normal");

  const duplicateQuery = await supabase
    .from("hotel_demands")
    .select("id")
    .eq("guest_name", body.guest_name)
    .eq("hotel", body.hotel)
    .eq("check_in", body.check_in)
    .limit(1);

  const duplicateScore = duplicateQuery.data?.length ? 95 : 0;

  const insertPayload = {
    agent_id: body.agent_id || null,
    agent_name: body.agent_name || null,
    guest_name: body.guest_name,
    city: body.city,
    hotel: body.hotel,
    check_in: body.check_in,
    check_out: body.check_out,
    nights,
    room_type: body.room_type,
    rooms: toNumber(body.rooms, 1),
    pax: toNumber(body.pax, 1),
    meal_plan: body.meal_plan || "RO",
    budget: toNumber(body.budget, 0),
    urgency: body.urgency || "normal",
    notes: body.notes || null,
    duplicate_score: duplicateScore,
    expected_market_price: expectedMarketPrice,
    risk_level: riskLevel,
    crowd_pressure: riskLevel === "critical" ? "very_high" : riskLevel === "high" ? "high" : "normal",
    status: "rfq_pending",
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
      description: "Offline hotel demand created and AI checks completed.",
      actor: "system",
      metadata: {
        duplicateScore,
        expectedMarketPrice,
        riskLevel,
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

  return NextResponse.json({ data });
}