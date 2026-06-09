import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LeakRow = {
  id: string;
  created_at?: string | null;
  customer_name?: string | null;
  agent_name?: string | null;
  agent_email?: string | null;
  agent_id?: string | null;
  booking_id?: string | null;
  leak_reason?: string | null;
  severity?: string | null;
  status?: string | null;
  estimated_profit?: number | string | null;
  total_price?: number | string | null;
  base_fare?: number | string | null;
  agent_commission?: number | string | null;
  pickup_city?: string | null;
  dropoff_city?: string | null;
};

function num(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function txt(value: unknown, fallback = "unknown") {
  return String(value || fallback).trim();
}

function normalizeReason(reason: unknown) {
  return txt(reason, "unknown_leak").toLowerCase().replace(/\s+/g, "_");
}

function rootCause(reason: string) {
  const r = reason.toLowerCase();

  if (r.includes("commission")) return "agent_commission_control";
  if (r.includes("refund")) return "refund_abuse_or_mismatch";
  if (r.includes("price") || r.includes("fare") || r.includes("margin")) return "pricing_margin_leak";
  if (r.includes("supplier") || r.includes("cost")) return "supplier_cost_mismatch";
  if (r.includes("cash") || r.includes("payment") || r.includes("balance")) return "payment_recovery_gap";
  if (r.includes("manual") || r.includes("staff") || r.includes("entry")) return "staff_workflow_error";

  return "general_profit_leak";
}

function rootLabel(root: string) {
  const map: Record<string, string> = {
    agent_commission_control: "Agent Commission Control",
    refund_abuse_or_mismatch: "Refund Abuse / Mismatch",
    pricing_margin_leak: "Pricing & Margin Leak",
    supplier_cost_mismatch: "Supplier Cost Mismatch",
    payment_recovery_gap: "Payment Recovery Gap",
    staff_workflow_error: "Staff Workflow Error",
    general_profit_leak: "General Profit Leak",
  };

  return map[root] || root;
}

function buildPlaybook(root: string, recurringCount: number, loss: number) {
  const common = [
    "Open the linked booking and verify selling price, supplier cost, commission, and payment status.",
    "Compare transaction with agent ledger and original quotation.",
    "Add recovery note before marking issue resolved.",
  ];

  const specific: Record<string, string[]> = {
    agent_commission_control: [
      "Check whether commission exceeded approved rule.",
      "Freeze extra commission until manager approval.",
      "Review last 10 bookings of this agent for the same pattern.",
    ],
    refund_abuse_or_mismatch: [
      "Match refund amount with supplier refund confirmation.",
      "Block manual refund posting without approval.",
      "Create reversal entry if refund was over-posted.",
    ],
    pricing_margin_leak: [
      "Recalculate sale price, base cost, and minimum safe margin.",
      "Lock quote if sale price is below approved profit floor.",
      "Update pricing rule so same package/route cannot leak again.",
    ],
    supplier_cost_mismatch: [
      "Verify supplier invoice against booking cost.",
      "Request supplier credit note for overcharge.",
      "Flag supplier if mismatch repeats.",
    ],
    payment_recovery_gap: [
      "Check pending receivable and promised payment date.",
      "Send recovery reminder immediately.",
      "Escalate if promise date has expired.",
    ],
    staff_workflow_error: [
      "Identify staff member who posted the manual entry.",
      "Require approval for this workflow next time.",
      "Add validation rule to stop repeated manual mistake.",
    ],
    general_profit_leak: [
      "Audit booking, ledger, supplier cost, and commission manually.",
      "Mark root reason after review.",
      "Create prevention rule if same issue appears again.",
    ],
  };

  return {
    title: recurringCount >= 3 ? "Recurring Leak Emergency Playbook" : "Profit Recovery Playbook",
    steps: Array.from(new Set([...(specific[root] || []), ...common])).slice(0, 6),
    recovery_deadline_hours: loss >= 100000 || recurringCount >= 3 ? 24 : loss >= 50000 ? 48 : 72,
    recommended_owner:
      loss >= 100000 || recurringCount >= 3
        ? "Director / Finance Head"
        : loss >= 50000
          ? "Accounts Manager"
          : "Accounts Officer",
  };
}

function warningEmail(agentName: string, reason: string, rootCauseLabel: string, recurringCount: number, loss: number, forecast: number) {
  return {
    subject: "Action Required: Profit Leakage Pattern Detected",
    body: `Dear ${agentName},

Our AI Profit Leak War Room has detected a profit leakage pattern in your workflow.

Leak Type: ${reason.replaceAll("_", " ")}
Root Cause: ${rootCauseLabel}
Recurring Count: ${recurringCount}
Current Recoverable Impact: PKR ${loss.toLocaleString()}
Projected 30-Day Risk if not fixed: PKR ${forecast.toLocaleString()}

Required Action:
1. Review the related booking and ledger immediately.
2. Correct pricing, commission, refund, supplier cost, or payment mismatch.
3. Confirm recovery status with Accounts.
4. Avoid repeating the same pattern in future bookings.

Repeated leakage may trigger commission freeze, credit review, or management escalation.

Regards,
Arfeen Travel AI Accounts Intelligence`,
  };
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase admin client not configured" }, { status: 500 });
  }

  const url = new URL(req.url);
  const search = (url.searchParams.get("search") || "").toLowerCase().trim();
  const severityFilter = url.searchParams.get("severity") || "all";
  const rootFilter = url.searchParams.get("root_cause") || "all";
  const agentFilter = url.searchParams.get("agent") || "all";

  const { data, error } = await supabase
    .from("v_profit_leak_detector")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(700);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (data || []) as LeakRow[];

  const patternCount = new Map<string, number>();
  const agentLoss = new Map<string, number>();
  const agentEvents = new Map<string, number>();

  rows.forEach((row) => {
    const agentName = txt(row.agent_name, "Unknown Agent");
    const reason = normalizeReason(row.leak_reason);
    const key = `${agentName}::${reason}`;

    patternCount.set(key, (patternCount.get(key) || 0) + 1);
    agentLoss.set(agentName, (agentLoss.get(agentName) || 0) + Math.abs(num(row.estimated_profit)));
    agentEvents.set(agentName, (agentEvents.get(agentName) || 0) + 1);
  });

  let processed = rows.map((row) => {
    const agentName = txt(row.agent_name, "Unknown Agent");
    const reason = normalizeReason(row.leak_reason);
    const key = `${agentName}::${reason}`;
    const recurringCount = patternCount.get(key) || 0;
    const isRecurring = recurringCount >= 3;
    const loss = Math.abs(num(row.estimated_profit));
    const root = rootCause(reason);
    const rootCauseLabel = rootLabel(root);
    const agentTotalLoss = agentLoss.get(agentName) || 0;
    const agentTotalEvents = agentEvents.get(agentName) || 0;

    const moneyAtRisk30Days = Math.round(loss * (isRecurring ? 4.2 : 1.8));
    const agentDnaRiskScore = Math.min(
      100,
      Math.round(agentTotalEvents * 9 + agentTotalLoss / 2500 + (isRecurring ? 25 : 0))
    );

    const recoveryPriorityScore = Math.min(
      100,
      Math.round(loss / 1500 + recurringCount * 12 + agentDnaRiskScore * 0.35)
    );

    const finalSeverity =
      recoveryPriorityScore >= 85 || isRecurring
        ? "critical"
        : recoveryPriorityScore >= 65
          ? "high"
          : recoveryPriorityScore >= 40
            ? "medium"
            : row.severity || "low";

    const escalationLevel =
      recoveryPriorityScore >= 85 || isRecurring
        ? "director"
        : recoveryPriorityScore >= 65
          ? "manager"
          : "agent";

    const commissionFreezeRecommended =
      isRecurring && (agentDnaRiskScore >= 70 || agentTotalLoss >= 75000);

    const playbook = buildPlaybook(root, recurringCount, loss);

    return {
      ...row,
      leak_reason: reason,
      estimated_profit: loss,
      severity: finalSeverity,
      is_recurring: isRecurring,
      recurring_count: recurringCount,

      root_cause: root,
      root_cause_label: rootCauseLabel,

      agent_dna_risk_score: agentDnaRiskScore,
      agent_total_leak_events: agentTotalEvents,
      agent_total_loss: Math.round(agentTotalLoss),

      recovery_priority_score: recoveryPriorityScore,
      money_at_risk_30_days: moneyAtRisk30Days,
      escalation_level: escalationLevel,
      commission_freeze_recommended: commissionFreezeRecommended,

      recovery_deadline_hours: playbook.recovery_deadline_hours,
      recommended_owner: playbook.recommended_owner,
      ai_playbook: playbook,

      warning_email: warningEmail(
        agentName,
        reason,
        rootCauseLabel,
        recurringCount,
        loss,
        moneyAtRisk30Days
      ),

      next_best_action: commissionFreezeRecommended
        ? "Freeze commission and escalate to finance head"
        : isRecurring
          ? "Send warning and audit last 10 bookings"
          : recoveryPriorityScore >= 65
            ? "Open ledger and recover amount"
            : "Review and monitor",

      action_links: {
        ledger: row.agent_id ? `/accounts/agent-ledger?agent_id=${row.agent_id}` : "/accounts/agent-ledger",
        booking: row.booking_id ? `/transport/bookings/${row.booking_id}` : null,
        recovery: `/accounts/ai-aging?risk_filter=danger&agent=${encodeURIComponent(agentName)}`,
      },
    };
  });

  processed = processed.filter((row: any) => {
    const haystack = `${row.customer_name || ""} ${row.agent_name || ""} ${row.leak_reason || ""} ${row.root_cause_label || ""}`.toLowerCase();

    return (
      (!search || haystack.includes(search)) &&
      (severityFilter === "all" || row.severity === severityFilter) &&
      (rootFilter === "all" || row.root_cause === rootFilter) &&
      (agentFilter === "all" || row.agent_name === agentFilter)
    );
  });

  const summary = {
    total_events: processed.length,
    total_recoverable: processed.reduce((sum: number, row: any) => sum + num(row.estimated_profit), 0),
    money_at_risk_30_days: processed.reduce((sum: number, row: any) => sum + num(row.money_at_risk_30_days), 0),
    recurring_patterns: processed.filter((row: any) => row.is_recurring).length,
    critical_events: processed.filter((row: any) => row.severity === "critical").length,
    commission_freeze_cases: processed.filter((row: any) => row.commission_freeze_recommended).length,
    average_agent_dna_risk:
      processed.length > 0
        ? Math.round(processed.reduce((sum: number, row: any) => sum + num(row.agent_dna_risk_score), 0) / processed.length)
        : 0,
  };

  const rootCauseSummary = Object.values(
    processed.reduce((acc: Record<string, any>, row: any) => {
      const key = row.root_cause;
      if (!acc[key]) {
        acc[key] = {
          root_cause: key,
          label: row.root_cause_label,
          count: 0,
          recoverable: 0,
          risk_30_days: 0,
        };
      }

      acc[key].count += 1;
      acc[key].recoverable += num(row.estimated_profit);
      acc[key].risk_30_days += num(row.money_at_risk_30_days);

      return acc;
    }, {})
  ).sort((a: any, b: any) => b.risk_30_days - a.risk_30_days);

  return NextResponse.json({
    ok: true,
    data: processed,
    summary,
    root_cause_summary: rootCauseSummary,
    agents: Array.from(new Set(rows.map((row) => txt(row.agent_name, "Unknown Agent")))).sort(),
    root_causes: [
      "agent_commission_control",
      "refund_abuse_or_mismatch",
      "pricing_margin_leak",
      "supplier_cost_mismatch",
      "payment_recovery_gap",
      "staff_workflow_error",
      "general_profit_leak",
    ],
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const action = String(body.action || "");
  const leak = body.leak || null;

  if (!action || !leak) {
    return NextResponse.json({ ok: false, error: "Missing action or leak payload" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message:
      action === "freeze_commission"
        ? "Commission freeze recommendation prepared."
        : action === "send_warning"
          ? "Agent warning draft prepared."
          : action === "open_recovery"
            ? "Recovery workflow prepared."
            : "Next best action prepared.",
    action,
    warning_email: leak.warning_email || null,
    playbook: leak.ai_playbook || null,
    links: leak.action_links || null,
  });
}