import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = createClient();
  let requestBody: any = null;

  try {
    requestBody = await req.json();

    const {
      from,
      to,
      cabin_class,
      airline_code,
      base_fare_manual,
      agent_commission_percent,
      profit_percent,
    } = requestBody;

    const baseFare = Number(base_fare_manual ?? 0);

    if (!from || !to || !cabin_class || !baseFare || baseFare <= 0) {
      return NextResponse.json(
        {
          error:
            "from, to, cabin_class and base_fare_manual are required for flight quote",
        },
        { status: 400 }
      );
    }

    // 1) Load FLIGHT rules
    const { data: rules, error: rulesError } = await supabase
      .from("rate_rules")
      .select("*")
      .eq("service_type", "flight")
      .eq("active", true)
      .order("priority", { ascending: true });

    if (rulesError) {
      console.error("flight quote rulesError", rulesError);
    }

    let selectedRule: any = null;

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        if (rule.flight_from && rule.flight_from !== from) continue;
        if (rule.flight_to && rule.flight_to !== to) continue;
        if (rule.cabin_class && rule.cabin_class !== cabin_class) continue;
        if (rule.airline_code && rule.airline_code !== airline_code) continue;

        selectedRule = rule;
        break;
      }
    }

    // 2) Commission / profit %
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

    await supabase.from("rate_engine_logs").insert([
      {
        service_type: "flight",
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
    console.error("flight quote exception", err);

    try {
      await supabase.from("rate_engine_logs").insert([
        {
          service_type: "flight",
          request: requestBody,
          selected_rule_id: null,
          base_fare: null,
          agent_commission: null,
          total_price: null,
          error: err?.message ?? String(err),
        },
      ]);
    } catch (logErr) {
      console.error("flight quote log error", logErr);
    }

    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
