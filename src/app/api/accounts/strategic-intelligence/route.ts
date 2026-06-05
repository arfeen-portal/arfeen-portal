import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const emptyData = {
  heatmap: [],
  cashflow: [],
  travelOS: [],
  healing: [],
  negotiation: [],
};

function safeNumber(value: any) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function buildWarRoom(data: {
  heatmap: any[];
  cashflow: any[];
  travelOS: any[];
  healing: any[];
  negotiation: any[];
}) {
  const cash = data.cashflow?.[0] || {};

  const projectedShortage = safeNumber(cash.projected_shortage);
  const expectedInflow = safeNumber(cash.expected_inflow);
  const expectedOutflow = safeNumber(cash.expected_outflow);

  const criticalHealing = data.healing.filter((x) =>
    String(x.severity || "").toLowerCase().includes("critical")
  ).length;

  const highSupplierRisk = data.negotiation.filter(
    (x) => safeNumber(x.overpricing_percentage) >= 15
  ).length;

  let score = 100;

  if (projectedShortage > 0) score -= 25;
  if (projectedShortage > expectedInflow * 0.25) score -= 15;
  if (criticalHealing > 0) score -= Math.min(25, criticalHealing * 8);
  if (highSupplierRisk > 0) score -= Math.min(20, highSupplierRisk * 5);
  if (data.travelOS.length > 40) score -= 10;

  const finalScore = Math.max(0, score);

  let mode: "NORMAL" | "WATCH" | "CRITICAL" = "NORMAL";
  if (finalScore < 45) mode = "CRITICAL";
  else if (finalScore < 75) mode = "WATCH";

  const actions = [];

  if (projectedShortage > 0) {
    actions.push({
      title: "Recover urgent agent payments",
      priority: "critical",
      reason: "Projected cash shortage detected by AI forecast engine.",
      action: "Open urgent recovery list and follow up high-risk agents first.",
      impact: `Potential cash protection: PKR ${projectedShortage.toLocaleString("en-PK")}`,
    });
  }

  if (highSupplierRisk > 0) {
    actions.push({
      title: "Renegotiate overpriced suppliers",
      priority: "high",
      reason: `${highSupplierRisk} suppliers are above market benchmark.`,
      action: "Start negotiation from suggested AI benchmark rate.",
      impact: "Improves package margin and reduces hidden profit leakage.",
    });
  }

  if (criticalHealing > 0) {
    actions.push({
      title: "Resolve critical ERP anomalies",
      priority: "critical",
      reason: `${criticalHealing} critical system findings detected.`,
      action: "Use Self-Healing ERP to resolve high-severity issues first.",
      impact: "Reduces accounting mismatch and operational leakage.",
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: "Scale premium Umrah sales",
      priority: "growth",
      reason: "No emergency risk detected.",
      action: "Push premium family/VIP packages in high-demand markets.",
      impact: "Converts stable operations into revenue growth.",
    });
  }

  return {
    mode,
    score: finalScore,
    projectedShortage,
    expectedInflow,
    expectedOutflow,
    actions,
  };
}

function buildCompetitorRadar(data: {
  heatmap: any[];
  negotiation: any[];
  cashflow: any[];
}) {
  const topCities = [...data.heatmap]
    .sort((a, b) => safeNumber(b.demand_score) - safeNumber(a.demand_score))
    .slice(0, 5);

  const overpricedSuppliers = data.negotiation.filter(
    (x) => safeNumber(x.overpricing_percentage) >= 10
  );

  const cash = data.cashflow?.[0] || {};
  const shortage = safeNumber(cash.projected_shortage);

  const radar = [];

  if (topCities.length > 0) {
    radar.push({
      title: "Premium Umrah demand pockets detected",
      signal: topCities.map((x) => x.city).join(", "),
      weakness: "Generic portals cannot personalize religious journey packages city-wise.",
      arfeenMove: "Push AI-built family, VIP, and elderly-friendly Umrah packages in these cities.",
      advantage: "Umrah-specialized personalization",
    });
  }

  if (overpricedSuppliers.length > 0) {
    radar.push({
      title: "Supplier price gap opportunity",
      signal: `${overpricedSuppliers.length} suppliers above benchmark`,
      weakness: "Most travel portals show prices; they do not negotiate intelligently.",
      arfeenMove: "Use AI negotiation rate to protect margin before package publishing.",
      advantage: "Profit-aware supplier intelligence",
    });
  }

  if (shortage > 0) {
    radar.push({
      title: "Cashflow discipline advantage",
      signal: `Projected shortage PKR ${shortage.toLocaleString("en-PK")}`,
      weakness: "Many agencies discover cash problems after supplier pressure starts.",
      arfeenMove: "Recover agents, delay low-priority supplier payments, and freeze risky credit.",
      advantage: "AI CFO layer",
    });
  }

  radar.push({
    title: "Transport bundling weakness in market",
    signal: "Saudi transport + hotel + visa + package flow can be unified.",
    weakness: "Global portals are strong in booking, weak in Umrah operations execution.",
    arfeenMove: "Bundle private transport, ziyarat, hotels, and agent ledger into one offer.",
    advantage: "End-to-end Umrah operating system",
  });

  return radar;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json({
        ok: false,
        error: "Supabase admin client not configured.",
        data: {
          ...emptyData,
          warRoom: buildWarRoom(emptyData),
          competitorRadar: buildCompetitorRadar(emptyData),
        },
      });
    }

    const [heatmapRes, cashflowRes, travelOSRes, healingRes, negotiationRes] =
      await Promise.all([
        supabase
          .from("umrah_heatmap_signals")
          .select("*")
          .order("demand_score", { ascending: false }),

        supabase
          .from("ai_cashflow_forecasts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1),

        supabase
          .from("travel_os_live_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),

        supabase
          .from("self_healing_erp_findings")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),

        supabase
          .from("ai_negotiation_engine")
          .select("*")
          .order("overpricing_percentage", { ascending: false }),
      ]);

    const data = {
      heatmap: heatmapRes.data ?? [],
      cashflow: cashflowRes.data ?? [],
      travelOS: travelOSRes.data ?? [],
      healing: healingRes.data ?? [],
      negotiation: negotiationRes.data ?? [],
    };

    return NextResponse.json({
      ok: true,
      data: {
        ...data,
        warRoom: buildWarRoom(data),
        competitorRadar: buildCompetitorRadar(data),
      },
      errors: {
        heatmap: heatmapRes.error?.message ?? null,
        cashflow: cashflowRes.error?.message ?? null,
        travelOS: travelOSRes.error?.message ?? null,
        healing: healingRes.error?.message ?? null,
        negotiation: negotiationRes.error?.message ?? null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Unknown server error",
        data: emptyData,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "FIX_ERP_ISSUE") {
      const issueId = String(body?.issueId || "");

      if (!issueId) {
        return NextResponse.json(
          { ok: false, error: "issueId is required." },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("self_healing_erp_findings")
        .update({
          status: "resolved",
        })
        .eq("id", issueId)
        .select("*")
        .single();

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "ERP issue marked as resolved.",
        data,
      });
    }

    if (action === "EXECUTE_AI_PLAN") {
      const plan = Array.isArray(body?.plan) ? body.plan : [];

      return NextResponse.json({
        ok: true,
        message: "AI strategic plan executed in command mode.",
        executedAt: new Date().toISOString(),
        actions: plan.map((item: any, index: number) => ({
          id: `${Date.now()}-${index}`,
          title: item?.title || "AI Action",
          status: "queued",
          priority: item?.priority || "normal",
          result:
            "Action prepared for operator execution. Future upgrade can connect this with WhatsApp, agent credit control, supplier tasks, and notification engine.",
        })),
      });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid action." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Unknown server error" },
      { status: 500 }
    );
  }
}