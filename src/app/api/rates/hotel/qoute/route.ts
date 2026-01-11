import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const supabase = createClient();
  let requestBody: any = null;

  try {
    requestBody = await req.json();

    const {
      city,
      hotel_star,
      room_type,
      nights,
      base_per_night_manual,
      agent_commission_percent,
      profit_percent,
    } = requestBody;

    const nightsNum = Number(nights ?? 0);

    if (!city || !room_type || !nightsNum || nightsNum <= 0) {
      return NextResponse.json(
        { error: "city, room_type and nights are required" },
        { status: 400 }
      );
    }

    // 1) Load active HOTEL rules
    const { data: rules, error: rulesError } = await supabase
      .from("rate_rules")
      .select("*")
      .eq("service_type", "hotel")
      .eq("active", true)
      .order("priority", { ascending: true });

    if (rulesError) {
      console.error("hotel quote rulesError", rulesError);
    }

    let selectedRule: any = null;

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        if (rule.hotel_city && rule.hotel_city !== city) continue;
        if (rule.hotel_star && rule.hotel_star !== hotel_star) continue;
        if (rule.room_type && rule.room_type !== room_type) continue;

        if (rule.min_nights !== null && nightsNum < Number(rule.min_nights))
          continue;
        if (rule.max_nights !== null && nightsNum > Number(rule.max_nights))
          continue;

        selectedRule = rule;
        break;
      }
    }

    // 2) Calculate per-night
    let perNight = 0;

    if (selectedRule && selectedRule.base_flat != null) {
      perNight = Number(selectedRule.base_flat);
    } else if (selectedRule && selectedRule.base_per_km != null) {
      // fallback: per_km column as per-night
      perNight = Number(selectedRule.base_per_km);
    }

    // Manual override
    if (base_per_night_manual && Number(base_per_night_manual) > 0) {
      perNight = Number(base_per_night_manual);
    }

    if (!perNight || perNight <= 0) {
      return NextResponse.json(
        { error: "No matching rule or price for hotel" },
        { status: 400 }
      );
    }

    const baseFare = perNight * nightsNum;

    // 3) Commission / profit %
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
      per_night: Number(perNight.toFixed(2)),
      base_fare: Number(baseFare.toFixed(2)),
      agent_commission: Number(agentCommissionAmount.toFixed(2)),
      total_price: Number(totalPrice.toFixed(2)),
      rule_id: selectedRule?.id ?? null,
    };

    await supabase.from("rate_engine_logs").insert([
      {
        service_type: "hotel",
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
    console.error("hotel quote exception", err);

    try {
      await supabase.from("rate_engine_logs").insert([
        {
          service_type: "hotel",
          request: requestBody,
          selected_rule_id: null,
          base_fare: null,
          agent_commission: null,
          total_price: null,
          error: err?.message ?? String(err),
        },
      ]);
    } catch (logErr) {
      console.error("hotel quote log error", logErr);
    }

    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
