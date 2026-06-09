import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n || 0)));
}

function riskLevel(score: number) {
  if (score >= 75) return "critical";
  if (score >= 55) return "high";
  if (score >= 35) return "medium";
  return "low";
}

function trendFromScore(score: number): "up" | "down" | "stable" {
  if (score >= 65) return "up";
  if (score <= 35) return "down";
  return "stable";
}

function routeKey(b: any) {
  const from = b.pickup_city || "Unknown";
  const to = b.dropoff_city || "Unknown";
  return `${from} → ${to}`;
}

async function buildHealthData() {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) throw new Error("Supabase admin client not configured");

  const [agentsRes, bookingsRes, refundsRes] = await Promise.all([
    supabase
      .from("agents")
      .select("id,name,email,phone,agent_code,status,is_active,is_credit_blocked,credit_limit,created_at"),
    supabase
      .from("transport_bookings")
      .select("id,agent_id,total_price,status,pickup_city,dropoff_city,pickup_time,created_at"),
    supabase
      .from("refund_control_cases")
      .select("id,agent_id,status,refund_amount,created_at"),
  ]);

  if (agentsRes.error) throw agentsRes.error;
  if (bookingsRes.error) throw bookingsRes.error;
  if (refundsRes.error) throw refundsRes.error;

  const agents = agentsRes.data || [];
  const bookings = bookingsRes.data || [];
  const refunds = refundsRes.data || [];

  const dna = agents.map((agent: any) => {
    const agentBookings = bookings.filter((b: any) => b.agent_id === agent.id);
    const agentRefunds = refunds.filter((r: any) => r.agent_id === agent.id);

    const totalBookings = agentBookings.length;
    const totalSales = agentBookings.reduce(
      (sum: number, b: any) => sum + Number(b.total_price || 0),
      0
    );

    const completedBookings = agentBookings.filter(
      (b: any) => String(b.status || "").toLowerCase() === "completed"
    ).length;

    const refundRatio = totalBookings
      ? (agentRefunds.length / totalBookings) * 100
      : 0;

    const paymentDiscipline = clamp(
      totalBookings ? (completedBookings / totalBookings) * 100 : 60
    );

    const refundBehavior = clamp(100 - refundRatio * 8);
    const bookingHabits = clamp(totalBookings * 8);
    const seasonalPerformance = clamp(totalSales / 5000);
    const negotiationPattern = clamp(70 - refundRatio * 2 + totalBookings * 1.5);
    const growthPotential = clamp((bookingHabits + seasonalPerformance) / 2);

    const fraudProbability = clamp(
      refundRatio * 6 + (paymentDiscipline < 45 ? 20 : 0)
    );

    const churnRisk = clamp(
      100 -
        (bookingHabits * 0.45 +
          seasonalPerformance * 0.35 +
          paymentDiscipline * 0.2)
    );

    const projectedRevenueImpact =
      churnRisk >= 65 ? Math.round(totalSales || totalBookings * 75000) : 0;

    const overallScore = clamp(
      paymentDiscipline * 0.2 +
        refundBehavior * 0.15 +
        bookingHabits * 0.15 +
        seasonalPerformance * 0.15 +
        negotiationPattern * 0.1 +
        growthPotential * 0.15 +
        (100 - fraudProbability) * 0.1
    );

    const topRoute =
      agentBookings.reduce((acc: Record<string, number>, b: any) => {
        const key = routeKey(b);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}) || {};

    const primaryRoute =
      Object.entries(topRoute).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] ||
      "No route";

    return {
      agent_id: agent.id,
      agent_name: agent.name || "Unknown Agent",
      agent_code: agent.agent_code || "-",
      status: agent.status || "-",
      is_active: agent.is_active !== false,
      is_credit_blocked: agent.is_credit_blocked === true,
      primary_route: primaryRoute,
      total_bookings: totalBookings,
      total_sales: Math.round(totalSales),
      payment_discipline: paymentDiscipline,
      refund_behavior: refundBehavior,
      booking_habits: bookingHabits,
      seasonal_performance: seasonalPerformance,
      fraud_probability: fraudProbability,
      negotiation_pattern: negotiationPattern,
      growth_potential: growthPotential,
      churn_risk: churnRisk,
      projected_revenue_impact: projectedRevenueImpact,
      trend: trendFromScore(growthPotential),
      overall_score: overallScore,
      risk_level: riskLevel(fraudProbability),
      ai_summary:
        fraudProbability >= 80
          ? "Critical fraud probability detected. Manual approval or blocking is recommended."
          : churnRisk >= 65
          ? `High churn risk. Projected next-month revenue impact is approximately PKR ${projectedRevenueImpact.toLocaleString()}.`
          : growthPotential >= 65
          ? "Strong growth signal. Consider priority rates, inventory access, or dedicated support."
          : "Agent profile is stable with normal activity pattern.",
    };
  });

  const riskyAgentIds = new Set(
    dna.filter((d) => d.risk_level === "high" || d.risk_level === "critical").map((d) => d.agent_id)
  );

  const routeMap: Record<string, any> = {};

  bookings.forEach((b: any) => {
    const key = routeKey(b);
    if (!routeMap[key]) {
      routeMap[key] = {
        route: key,
        total_bookings: 0,
        risky_agents: new Set<string>(),
        total_revenue: 0,
      };
    }

    routeMap[key].total_bookings += 1;
    routeMap[key].total_revenue += Number(b.total_price || 0);

    if (riskyAgentIds.has(b.agent_id)) {
      routeMap[key].risky_agents.add(b.agent_id);
    }
  });

  const route_risk_map = Object.values(routeMap)
    .map((r: any) => ({
      route: r.route,
      total_bookings: r.total_bookings,
      risky_agents_count: r.risky_agents.size,
      total_revenue: Math.round(r.total_revenue),
      route_risk_score: clamp((r.risky_agents.size / Math.max(1, r.total_bookings)) * 100 + r.risky_agents.size * 12),
      alert:
        r.risky_agents.size >= 5
          ? "Route Risk: Multiple agents showing risky behavior on this route."
          : r.risky_agents.size >= 2
          ? "Watchlist: Some risky behavior detected on this route."
          : "Normal",
    }))
    .sort((a: any, b: any) => b.route_risk_score - a.route_risk_score);

  const riskyAgents = dna.filter((d) => d.risk_level === "high" || d.risk_level === "critical");
  const churnAgents = dna.filter((d) => d.churn_risk >= 65);
  const growthAgents = dna.filter((d) => d.growth_potential >= 65);

  const projected_loss_30_days = churnAgents.reduce(
    (sum, a) => sum + Number(a.projected_revenue_impact || 0),
    0
  );

  return {
    summary: {
      total_agents: agents.length,
      risky_agents: riskyAgents.length,
      churn_risk_agents: churnAgents.length,
      growth_agents: growthAgents.length,
      projected_loss_30_days,
      avg_overall_score: dna.length
        ? Math.round(dna.reduce((s, d) => s + d.overall_score, 0) / dna.length)
        : 0,
    },
    dna,
    route_risk_map,
    signals: [
      {
        signal_type: "route_risk",
        title: "Agent Risk Correlation Map",
        severity: route_risk_map.some((r: any) => r.risky_agents_count >= 5) ? "high" : "medium",
        description: "AI is checking whether risk is agent-specific or route-specific.",
        recommendation: "If multiple agents are risky on the same route, audit route pricing, vendor quality, refund pattern, and operational SLA.",
      },
      {
        signal_type: "cashflow",
        title: "Predictive Cash-Flow Impact",
        severity: projected_loss_30_days > 0 ? "high" : "low",
        description: `Projected 30-day revenue impact: PKR ${projected_loss_30_days.toLocaleString()}.`,
        recommendation: "Retain high-value agents before churn converts into actual revenue loss.",
      },
      {
        signal_type: "autopilot",
        title: "AI Auto-Pilot Ready",
        severity: riskyAgents.some((a) => a.fraud_probability >= 80) ? "critical" : "low",
        description: "Agents with fraud probability 80+ can be blocked or moved to manual review.",
        recommendation: "Use Auto-Pilot carefully. It updates agent status and blocks credit access.",
      },
    ],
  };
}

export async function GET() {
  try {
    const data = await buildHealthData();
    return NextResponse.json({ ok: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load AI financial health data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const agentId = body?.agent_id;
    const action = body?.action;

    if (!agentId) {
      return NextResponse.json(
        { ok: false, error: "agent_id is required" },
        { status: 400 }
      );
    }

    if (!["ai_autopilot", "manual_review", "reactivate"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    if (action === "reactivate") {
      const { error } = await supabase
        .from("agents")
        .update({
          is_active: true,
          is_credit_blocked: false,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", agentId);

      if (error) throw error;

      return NextResponse.json({
        ok: true,
        message: "Agent reactivated successfully.",
      });
    }

    const data = await buildHealthData();
    const agent = data.dna.find((a: any) => a.agent_id === agentId);

    if (!agent) {
      return NextResponse.json(
        { ok: false, error: "Agent not found in AI health data" },
        { status: 404 }
      );
    }

    if (action === "ai_autopilot" && agent.fraud_probability < 80) {
      return NextResponse.json(
        {
          ok: false,
          error: "AI Auto-Pilot only allows blocking when fraud probability is 80 or above.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("agents")
      .update({
        is_active: false,
        is_credit_blocked: true,
        status: action === "ai_autopilot" ? "ai_blocked" : "manual_review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message:
        action === "ai_autopilot"
          ? "AI Auto-Pilot blocked this agent and moved them to manual review."
          : "Agent moved to manual review.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "AI action failed" },
      { status: 500 }
    );
  }
}