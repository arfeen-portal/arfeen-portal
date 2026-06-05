import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

type AnyAgent = Record<string, any>;

type ScoreReason = {
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "positive" | "normal";
  impact: number;
};

type TrustRule = {
  rule: string;
  reason: string;
  severity: "critical" | "high" | "medium" | "normal" | "positive";
};

function num(value: any, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function moneyRound(value: number) {
  return Math.round(Number.isFinite(value) ? value : 0);
}

function getRiskBand(score: number) {
  if (score < 35) return "Critical";
  if (score < 50) return "High Risk";
  if (score < 70) return "Watchlist";
  if (score < 85) return "Healthy";
  return "Elite";
}

function getFinalDecision(agent: AnyAgent): "Grow" | "Watch" | "Freeze" {
  if (
    agent.score < 40 ||
    agent.fraud_probability >= 75 ||
    agent.credit_used_pct >= 95 ||
    agent.overdue_amount > 0
  ) {
    return "Freeze";
  }

  if (
    agent.score < 70 ||
    agent.fraud_probability >= 45 ||
    agent.avg_payment_delay_days >= 7 ||
    agent.refund_rate >= 12
  ) {
    return "Watch";
  }

  return "Grow";
}

function buildWhyThisScore(agent: AnyAgent): ScoreReason[] {
  const alerts: ScoreReason[] = [];

  if (agent.score < 40) {
    alerts.push({
      title: "Low master score",
      detail: `Agent score is ${agent.score}/100, which means this agent needs manual review before further credit exposure.`,
      severity: "critical",
      impact: 25,
    });
  }

  if (agent.refund_rate >= 12) {
    alerts.push({
      title: "Refund rate pressure",
      detail: `Refund rate is ${agent.refund_rate}%. This is reducing trust score and increasing future loss probability.`,
      severity: agent.refund_rate >= 20 ? "critical" : "high",
      impact: Math.min(30, Math.round(agent.refund_rate * 1.4)),
    });
  }

  if (agent.cancellation_rate >= 10) {
    alerts.push({
      title: "Cancellation behavior detected",
      detail: `Cancellation rate is ${agent.cancellation_rate}%. This may indicate weak customer filtering or unstable sales quality.`,
      severity: agent.cancellation_rate >= 18 ? "critical" : "high",
      impact: Math.min(25, Math.round(agent.cancellation_rate * 1.2)),
    });
  }

  if (agent.avg_payment_delay_days >= 7) {
    alerts.push({
      title: "Payment delay risk",
      detail: `Average payment delay is ${agent.avg_payment_delay_days} days. This directly affects credit trust and cashflow safety.`,
      severity: agent.avg_payment_delay_days >= 14 ? "critical" : "high",
      impact: Math.min(25, Math.round(agent.avg_payment_delay_days * 1.5)),
    });
  }

  if (agent.credit_used_pct >= 80) {
    alerts.push({
      title: "Credit limit pressure",
      detail: `Agent has used ${agent.credit_used_pct}% of credit capacity. New bookings should be restricted or approved manually.`,
      severity: agent.credit_used_pct >= 95 ? "critical" : "high",
      impact: Math.min(25, Math.round(agent.credit_used_pct / 5)),
    });
  }

  if (agent.overdue_amount > 0) {
    alerts.push({
      title: "Overdue balance exists",
      detail: `Overdue amount is PKR ${agent.overdue_amount.toLocaleString()}. Recovery workflow should be triggered immediately.`,
      severity: "critical",
      impact: 30,
    });
  }

  if (agent.profit_margin < 5 && agent.revenue > 0) {
    alerts.push({
      title: "Weak profit quality",
      detail: `Profit margin is only ${agent.profit_margin}%. Agent may be generating volume without healthy business value.`,
      severity: "medium",
      impact: 15,
    });
  }

  if (agent.dispute_count >= 2) {
    alerts.push({
      title: "Dispute pattern",
      detail: `${agent.dispute_count} disputes detected. This may indicate pricing conflict, service issue, or payment disagreement.`,
      severity: "high",
      impact: Math.min(20, agent.dispute_count * 5),
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      title: "Stable performance",
      detail:
        "No major negative factor detected. Score is supported by stable payments, acceptable refund behavior, and healthy commercial activity.",
      severity: "positive",
      impact: 0,
    });
  }

  return alerts.sort((a, b) => b.impact - a.impact);
}

function buildTrustContract(agent: AnyAgent): TrustRule[] {
  const rules: TrustRule[] = [];

  if (agent.final_decision === "Freeze") {
    rules.push({
      rule: "Next 7 bookings only advance payment",
      reason: "Agent is currently too risky for open-credit bookings.",
      severity: "critical",
    });
  }

  if (agent.credit_used_pct >= 80 || agent.overdue_amount > 0 || agent.score < 50) {
    const recommendedLimit = Math.max(0, moneyRound(agent.recommended_credit_limit));
    rules.push({
      rule: `Credit limit reduce to PKR ${recommendedLimit.toLocaleString()}`,
      reason: "Credit exposure should match current payment discipline and risk score.",
      severity: agent.credit_used_pct >= 95 ? "critical" : "high",
    });
  }

  if (agent.fraud_probability >= 45 || agent.refund_rate >= 12) {
    rules.push({
      rule: "Commission release after supplier confirmation",
      reason: "Refund/cancellation behavior is high, so commission should not be released too early.",
      severity: agent.fraud_probability >= 70 ? "critical" : "high",
    });
  }

  if (agent.refund_rate >= 10 || agent.cancellation_rate >= 10) {
    rules.push({
      rule: "Refund-heavy packages require admin approval",
      reason: "Agent has refund/cancellation pressure and should not freely sell high-risk packages.",
      severity: "high",
    });
  }

  if (agent.final_decision === "Grow") {
    rules.push({
      rule: "Eligible for premium inventory access",
      reason: "Agent score, payment behavior, and commercial value are healthy.",
      severity: "positive",
    });

    rules.push({
      rule: "Offer growth incentive with controlled credit expansion",
      reason: "Agent has strong potential, but credit should still grow gradually.",
      severity: "positive",
    });
  }

  if (rules.length === 0) {
    rules.push({
      rule: "Monitor weekly with normal activity allowed",
      reason: "No critical restriction is required right now.",
      severity: "normal",
    });
  }

  return rules;
}

function buildFuturePrediction(agent: AnyAgent) {
  const avgMonthlyBookings = Math.max(0, num(agent.booking_count));
  const scoreMultiplier = agent.score >= 85 ? 1.18 : agent.score >= 70 ? 1.05 : agent.score >= 50 ? 0.88 : 0.62;
  const expectedBookings = Math.max(0, round(avgMonthlyBookings * scoreMultiplier));

  const avgProfitPerBooking =
    agent.booking_count > 0 ? agent.total_profit / agent.booking_count : agent.total_profit > 0 ? agent.total_profit : 0;

  const expectedProfit = moneyRound(expectedBookings * avgProfitPerBooking * (agent.final_decision === "Freeze" ? 0.45 : 1));

  const expectedRefundRisk = clamp(
    agent.refund_rate * 1.15 +
      agent.cancellation_rate * 0.65 +
      agent.fraud_probability * 0.25 +
      (agent.avg_payment_delay_days >= 7 ? 8 : 0)
  );

  const expectedOverdue = moneyRound(
    Math.max(
      0,
      agent.outstanding_amount * 0.18 +
        agent.revenue * 0.025 * (agent.avg_payment_delay_days / 10) +
        agent.overdue_amount * 0.55
    )
  );

  const recommendedCreditLimit = moneyRound(
    agent.final_decision === "Freeze"
      ? Math.min(100000, Math.max(0, agent.credit_limit * 0.25))
      : agent.final_decision === "Watch"
        ? Math.max(100000, agent.credit_limit * 0.55)
        : Math.max(agent.credit_limit || 0, agent.revenue * 0.35)
  );

  const safeCommissionPct = clamp(
    agent.final_decision === "Freeze"
      ? 0
      : agent.final_decision === "Watch"
        ? Math.min(5, Math.max(1, agent.profit_margin * 0.25))
        : Math.min(12, Math.max(3, agent.profit_margin * 0.35))
  );

  return {
    expected_bookings: expectedBookings,
    expected_profit: expectedProfit,
    expected_overdue: expectedOverdue,
    expected_refund_risk: Math.round(expectedRefundRisk),
    recommended_credit_limit: recommendedCreditLimit,
    safe_commission_pct: Number(safeCommissionPct.toFixed(2)),
    final_decision: agent.final_decision,
  };
}

function buildRecoveryMission(agent: AnyAgent) {
  if (agent.final_decision === "Grow") {
    return {
      title: "Growth Mission",
      deadline_days: 30,
      target: "Increase profitable volume without increasing refund or overdue risk.",
      steps: [
        "Offer selected premium inventory access.",
        "Increase credit gradually after every 5 clean bookings.",
        "Monitor refund rate weekly.",
        "Reward early payment behavior.",
      ],
    };
  }

  if (agent.final_decision === "Watch") {
    return {
      title: "7-Day Trust Recovery Mission",
      deadline_days: 7,
      target: "Improve payment behavior and reduce refund/cancellation pressure.",
      steps: [
        "Allow bookings with partial or full advance only.",
        "Review every refund request before approval.",
        "Reduce credit exposure until next clean payment cycle.",
        "Require supplier confirmation before commission release.",
      ],
    };
  }

  return {
    title: "Emergency Freeze Recovery Mission",
    deadline_days: 7,
    target: "Stop further leakage and recover overdue exposure.",
    steps: [
      "Freeze new credit bookings immediately.",
      "Allow only advance-payment bookings for next 7 bookings.",
      "Trigger recovery call or WhatsApp follow-up.",
      "Release commission only after supplier confirmation and balance clearance.",
    ],
  };
}

function getAction(agent: AnyAgent) {
  if (agent.final_decision === "Freeze") {
    return {
      action: "Freeze / Manual Approval",
      route: `/accounts/agent-ledger?agent_id=${agent.agent_id || ""}`,
      severity: "critical",
    };
  }

  if (agent.final_decision === "Watch") {
    return {
      action: "Audit & Monitor Weekly",
      route: `/accounts/reports/outstanding?agent_id=${agent.agent_id || ""}`,
      severity: "high",
    };
  }

  return {
    action: "Grow Agent / Premium Deals",
    route: `/agents/${agent.agent_id || ""}`,
    severity: "positive",
  };
}

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("v_agent_scoring")
    .select("*")
    .order("score", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const processedData = (data || []).map((agent: AnyAgent) => {
    const score = clamp(num(agent.score));
    const previousScore = clamp(num(agent.previous_score, score));
    const totalProfit = num(agent.total_profit ?? agent.profit);
    const revenue = num(agent.revenue ?? agent.total_revenue);
    const overdueAmount = num(agent.overdue_amount);
    const creditLimit = num(agent.credit_limit);
    const outstanding = num(agent.outstanding_amount);
    const refundRate = num(agent.refund_rate);
    const cancellationRate = num(agent.cancellation_rate);
    const avgPaymentDelay = num(agent.avg_payment_delay_days);
    const bookingCount = num(agent.booking_count);
    const disputeCount = num(agent.dispute_count);

    const creditUsedPct =
      num(agent.credit_used_pct) ||
      (creditLimit > 0 ? clamp((outstanding / creditLimit) * 100) : 0);

    const profitMargin = revenue > 0 ? (totalProfit / revenue) * 100 : 0;
    const trend = score > previousScore ? 1 : score < previousScore ? -1 : 0;

    const fraudProbability = clamp(
      refundRate * 1.4 +
        cancellationRate * 1.1 +
        disputeCount * 4 +
        avgPaymentDelay * 1.8 +
        (creditUsedPct > 85 ? 18 : 0) -
        profitMargin * 0.35
    );

    const loyaltyIndex = clamp(
      bookingCount * 2.5 + profitMargin * 1.2 - refundRate - cancellationRate
    );

    const negotiationPower = clamp(
      profitMargin * 2 + bookingCount * 1.5 - avgPaymentDelay * 2
    );

    const silentLossForecast30Days = moneyRound(
      Math.max(
        0,
        overdueAmount * 0.08 +
          revenue * (refundRate / 100) * 0.18 +
          revenue * (cancellationRate / 100) * 0.12 +
          avgPaymentDelay * 1500
      )
    );

    const baseAgent = {
      ...agent,
      agent_id: agent.agent_id,
      agent_name: agent.agent_name || agent.name || "Unnamed Agent",
      score,
      previous_score: previousScore,
      score_delta: score - previousScore,
      trend,
      total_profit: totalProfit,
      revenue,
      outstanding_amount: outstanding,
      overdue_amount: overdueAmount,
      credit_limit: creditLimit,
      credit_used_pct: Math.round(creditUsedPct),
      profit_margin: Number(profitMargin.toFixed(2)),
      refund_rate: Number(refundRate.toFixed(2)),
      cancellation_rate: Number(cancellationRate.toFixed(2)),
      avg_payment_delay_days: Number(avgPaymentDelay.toFixed(1)),
      booking_count: bookingCount,
      dispute_count: disputeCount,
      risk_band: getRiskBand(score),
      fraud_probability: Math.round(fraudProbability),
      loyalty_index: Math.round(loyaltyIndex),
      negotiation_power: Math.round(negotiationPower),
      silent_loss_forecast_30_days: silentLossForecast30Days,
      commission_freeze_recommended: score < 40 || fraudProbability > 70 || creditUsedPct > 90,
    };

    const finalDecision = getFinalDecision(baseAgent);

    const enrichedAgent = {
      ...baseAgent,
      final_decision: finalDecision,
      recommended_credit_limit: 0,
      safe_commission_pct: 0,
    };

    const futurePrediction = buildFuturePrediction(enrichedAgent);

    const completedAgent = {
      ...enrichedAgent,
      recommended_credit_limit: futurePrediction.recommended_credit_limit,
      safe_commission_pct: futurePrediction.safe_commission_pct,
    };

    const action = getAction(completedAgent);
    const whyThisScore = buildWhyThisScore(completedAgent);
    const trustContract = buildTrustContract(completedAgent);
    const recoveryMission = buildRecoveryMission(completedAgent);

    return {
      ...completedAgent,
      future_prediction: futurePrediction,
      trust_contract: trustContract,
      recovery_mission: recoveryMission,
      ai_action: action.action,
      ai_action_route: action.route,
      ai_action_severity: action.severity,
      why_this_score: whyThisScore,
      primary_score_reason: whyThisScore[0]?.detail || "No major reason detected.",
      action_history_preview: [
        {
          action: "Future Scope",
          detail: "Create agent_actions_log table to persist freeze, warning, approval, and monitor actions.",
          status: "planned",
        },
      ],
      dna_summary:
        score >= 85
          ? "Elite growth agent with strong commercial potential."
          : finalDecision === "Freeze"
            ? "Critical-risk agent. Credit freeze, advance payment, and recovery mission recommended."
            : finalDecision === "Watch"
              ? "Controlled-risk agent. Continue business with restrictions and weekly monitoring."
              : "Stable agent. Continue monitoring with growth support.",
    };
  });

  const riskDistribution = [
    {
      name: "Critical",
      count: processedData.filter((a) => a.risk_band === "Critical").length,
    },
    {
      name: "High Risk",
      count: processedData.filter((a) => a.risk_band === "High Risk").length,
    },
    {
      name: "Watchlist",
      count: processedData.filter((a) => a.risk_band === "Watchlist").length,
    },
    {
      name: "Healthy",
      count: processedData.filter((a) => a.risk_band === "Healthy").length,
    },
    {
      name: "Elite",
      count: processedData.filter((a) => a.risk_band === "Elite").length,
    },
  ];

  const summary = {
    total_agents: processedData.length,
    elite_agents: processedData.filter((a) => a.risk_band === "Elite").length,
    critical_agents: processedData.filter((a) => a.risk_band === "Critical").length,
    high_risk_agents: processedData.filter((a) =>
      ["Critical", "High Risk"].includes(a.risk_band)
    ).length,
    total_profit: processedData.reduce((s, a) => s + num(a.total_profit), 0),
    total_outstanding: processedData.reduce((s, a) => s + num(a.outstanding_amount), 0),
    money_at_risk_30_days: processedData.reduce(
      (s, a) => s + num(a.silent_loss_forecast_30_days),
      0
    ),
    freeze_recommended: processedData.filter((a) => a.commission_freeze_recommended).length,
    decision_grow: processedData.filter((a) => a.final_decision === "Grow").length,
    decision_watch: processedData.filter((a) => a.final_decision === "Watch").length,
    decision_freeze: processedData.filter((a) => a.final_decision === "Freeze").length,
  };

  return NextResponse.json({
    ok: true,
    summary,
    risk_distribution: riskDistribution,
    data: processedData,
  });
}