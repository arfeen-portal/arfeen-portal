import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");
  const pax = Number(searchParams.get("pax") || "1");

  // 👉 Version A: MOCK FARES (local)
  const mock = [
    {
      airline: "Saudia",
      flight_no: "SV-705",
      depart_time: `${date}T03:00:00`,
      arrive_time: `${date}T06:00:00`,
      price: 950 * pax,
      currency: "SAR",
      stops: 0
    },
    {
      airline: "Air Blue",
      flight_no: "PA-870",
      depart_time: `${date}T05:00:00`,
      arrive_time: `${date}T10:00:00`,
      price: 820 * pax,
      currency: "SAR",
      stops: 1
    }
  ];

  // 👉 Save to cache (optional)
  for (const f of mock) {
    await supabase.from("live_flight_fares").insert({
      search_id: crypto.randomUUID(),
      airline: f.airline,
      flight_no: f.flight_no,
      from_city: from,
      to_city: to,
      depart_time: f.depart_time,
      arrive_time: f.arrive_time,
      price: f.price,
      currency: f.currency,
      stops: f.stops
    });
  }

  return Response.json(mock);
}
