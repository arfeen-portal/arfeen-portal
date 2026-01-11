import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const FALLBACK_PER_KM: Record<string, number> = {
  sedan: 2.5,
  hiace: 3.0,
  coaster: 3.5,
  gmc: 4.0,
};

export async function POST(req: NextRequest) {
  const supabase = createClient();
  let requestBody: any = null;

  try {
    requestBody = await req.json();

    const {
      vehicle_type,
      distance_km,
      agent_commission_percent,
      profit_percent,
    } = requestBody;

    const distance = Number(distance_km ?? 0);
    if (!vehicle_type || !distance || distance <= 0) {
      return NextResponse.json(
        { error: "vehicle_type and distance_km are required" },
        { status: 400 }
      );
    }

    // 1) Load rules from DB
    const { data: rules, error: rulesError } = await supabase
      .from("rate_rules")
      .select("*")
      .eq("service_type", "transport")
      .eq("active", true)
      .order("priority", { ascending: true });

    if (rulesError) {
      console.error("rate quote rulesError", rulesError);
    }

    let selectedRule: any = null;

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        // vehicle match: null = all vehicles
        if (rule.vehicle_type && rule.vehicle_type !== vehicle_type) {
          continue;
        }
        // distance filters
        if (rule.min_distance_km !== null && distance < Number(rule.min_distance_km)) {
          continue;
        }
        if (rule.max_distance_km !== null && distance > Number(rule.max_distance_km)) {
          continue;
        }
        selectedRule = rule;
        break; // first matching rule (lowest priority number)
      }
    }

    // 2) Calculate base fare
    let baseFare = 0;

    if (selectedRule) {
      if (selectedRule.use_flat && selectedRule.base_flat !== null) {
        baseFare = Number(selectedRule.base_flat);
      } else if (selectedRule.base_per_km !== null) {
        baseFare = Number(selectedRule.base_per_km) * distance;
      }
    }

    // agar koi rule hi match nahi hua to fallback per-km map
    if (!selectedRule || baseFare <= 0) {
      const perKm = FALLBACK_PER_KM[vehicle_type] ?? 3.0;
      baseFare = perKm * distance;
    }

    // 3) Commission & profit %
    const ruleCommission =
      selectedRule?.agent_commission_percent != null
        ? Number(selectedRule.agent_commission_percent)
        : 0;

    const ruleProfit =
      selectedRule?.profit_percent != null
        ? Number(selectedRule.profit_percent)
        : 0;

    const commissionPct =
      agent_commission_percent != null && agent_commission_percent !== ""
        ? Number(agent_commission_percent)
        : ruleCommission;

    const profitPct =
      profit_percent != null && profit_percent !== ""
        ? Number(profit_percent)
        : ruleProfit;

    const agentCommissionAmount = (baseFare * commissionPct) / 100;
    const profitAmount = (baseFare * profitPct) / 100;
    const totalPrice = baseFare + profitAmount;

    const response = {
      base_fare: Number(baseFare.toFixed(2)),
      agent_commission: Number(agentCommissionAmount.toFixed(2)),
      total_price: Number(totalPrice.toFixed(2)),
      rule_id: selectedRule?.id ?? null,
    };

    // 4) Log karein (best effort, error ignore)
    await supabase.from("rate_engine_logs").insert([
      {
        service_type: "transport",
        request: requestBody,
        selected_rule_id: selectedRule?.id ?? null,
        base_fare: response.base_fare,
        agent_commission: response.agent_commission,
        total_price: response.total_price,
        error: null,
      },
    ]);

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("rate quote exception", err);

    try {
      await supabase.from("rate_engine_logs").insert([
        {
          service_type: "transport",
          request: requestBody,
          selected_rule_id: null,
          base_fare: null,
          agent_commission: null,
          total_price: null,
          error: err?.message ?? String(err),
        },
      ]);
    } catch (logErr) {
      console.error("rate quote log error", logErr);
    }

    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
