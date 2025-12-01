import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const agentId = url.searchParams.get("agentId");
  if (!agentId) {
    return NextResponse.json({ error: "agentId required" }, { status: 400 });
  }

  const supabase = createClient();

  const { data: kpi, error } = await supabase
    .from("agent_kpis")
    .select("*")
    .eq("agent_id", agentId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!kpi) {
    return NextResponse.json({ error: "No data" }, { status: 404 });
  }

  const suggestions: string[] = [];

  const conversionRate =
    kpi.total_bookings > 0
      ? (kpi.confirmed_bookings / kpi.total_bookings) * 100
      : 0;

  if (conversionRate < 50) {
    suggestions.push(
      "Conversion rate low – give this agent better rates on 3–5 hot hotels to win more bookings."
    );
  } else if (conversionRate > 80) {
    suggestions.push(
      "High conversion – you can slightly increase margin for this agent on peak dates."
    );
  }

  if (kpi.cancelled_bookings > 5) {
    suggestions.push(
      "Many cancellations – review visa/flight rules with this agent and share clear guidelines."
    );
  }

  if (kpi.total_bookings >= 20) {
    suggestions.push(
      "Strong volume – consider loyalty program or private promo code for this agent."
    );
  }

  return NextResponse.json({
    kpi,
    conversionRate,
    suggestions,
  });
}
