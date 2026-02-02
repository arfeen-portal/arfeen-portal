import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // ✅ SAFE server client
    const supabase = createSupabaseServerClient();

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const date = searchParams.get("date") || "";
    const pax = Number(searchParams.get("pax") || "1");

    // 🔹 MOCK DATA (runtime only – build safe)
    const mock = [
      {
        airline: "Saudia",
        flight_no: "SV-705",
        depart_time: `${date}T08:00:00`,
        arrive_time: `${date}T10:00:00`,
        price: 950 * pax,
        currency: "SAR",
        stops: 0,
      },
      {
        airline: "Air Blue",
        flight_no: "PA-870",
        depart_time: `${date}T05:00:00`,
        arrive_time: `${date}T10:00:00`,
        price: 820 * pax,
        currency: "SAR",
        stops: 1,
      },
    ];

    /*
      OPTIONAL DB INSERT (runtime only)
      Uncomment only if you really want to log searches
    */
    /*
    for (const f of mock) {
      await supabase.from("live_flight_searches").insert({
        airline: f.airline,
        flight_no: f.flight_no,
        from_city: from,
        to_city: to,
        depart_time: f.depart_time,
        arrive_time: f.arrive_time,
        price: f.price,
        currency: f.currency,
        stops: f.stops,
      });
    }
    */

    return NextResponse.json(mock);
  } catch (e: any) {
    console.error("live-tickets search error:", e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
