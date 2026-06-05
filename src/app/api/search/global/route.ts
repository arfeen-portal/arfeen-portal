import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchTransport = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  agent_name: string | null;
  agent_code: string | null;
  pickup_city: string | null;
  dropoff_city: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  pickup_time: string | null;
  vehicle_type: string | null;
  status: string | null;
  total_price: number | string | null;
};

type SearchAgent = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  agent_code: string | null;
  is_active: boolean | null;
  status: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client is not available." },
        { status: 500 }
      );
    }

    const q = (req.nextUrl.searchParams.get("q") || "").trim();

    if (!q) {
      return NextResponse.json({
        ok: true,
        query: "",
        results: {
          transport: [],
          agents: [],
        },
        counts: {
          transport: 0,
          agents: 0,
          total: 0,
        },
      });
    }

    const ilike = `%${q}%`;

    const [transportRes, agentsRes] = await Promise.all([
      supabase
        .from("transport_bookings")
        .select(
          "id, customer_name, customer_phone, agent_name, agent_code, pickup_city, dropoff_city, pickup_location, dropoff_location, pickup_time, vehicle_type, status, total_price"
        )
        .or(
          [
            `customer_name.ilike.${ilike}`,
            `customer_phone.ilike.${ilike}`,
            `agent_name.ilike.${ilike}`,
            `agent_code.ilike.${ilike}`,
            `pickup_city.ilike.${ilike}`,
            `dropoff_city.ilike.${ilike}`,
            `pickup_location.ilike.${ilike}`,
            `dropoff_location.ilike.${ilike}`,
            `vehicle_type.ilike.${ilike}`,
            `status.ilike.${ilike}`,
          ].join(",")
        )
        .order("pickup_time", { ascending: false })
        .limit(15),

      supabase
        .from("agents")
        .select(
          "id, name, email, phone, country, city, agent_code, is_active, status"
        )
        .or(
          [
            `name.ilike.${ilike}`,
            `email.ilike.${ilike}`,
            `phone.ilike.${ilike}`,
            `country.ilike.${ilike}`,
            `city.ilike.${ilike}`,
            `agent_code.ilike.${ilike}`,
            `status.ilike.${ilike}`,
          ].join(",")
        )
        .order("created_at", { ascending: false })
        .limit(15),
    ]);

    if (transportRes.error) throw transportRes.error;
    if (agentsRes.error) throw agentsRes.error;

    const transport = (transportRes.data || []) as SearchTransport[];
    const agents = (agentsRes.data || []) as SearchAgent[];

    return NextResponse.json({
      ok: true,
      query: q,
      results: {
        transport,
        agents,
      },
      counts: {
        transport: transport.length,
        agents: agents.length,
        total: transport.length + agents.length,
      },
    });
  } catch (error) {
    console.error("GET /api/search/global error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}