import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

function jsonOk(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function jsonError(error: string, status = 400, details?: any) {
  return NextResponse.json({ error, details }, { status });
}

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

function daysBetween(from?: string | null, to = new Date()) {
  if (!from) return 0;

  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return 0;

  const diff = to.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function approvalLevel(score: number) {
  if (score >= 81) return "owner_approval";
  if (score >= 61) return "admin_approval";
  if (score >= 31) return "accountant_approval";
  return "auto_approval";
}

function calculateProfitLeak(refundAmount: number, supplierRecovery: number) {
  const leakAmount = Math.max(0, refundAmount - supplierRecovery);
  const ratio = refundAmount > 0 ? leakAmount / refundAmount : 0;

  let level = "none";

  if (ratio >= 0.75) level = "critical";
  else if (ratio >= 0.5) level = "high";
  else if (ratio >= 0.25) level = "medium";
  else if (ratio > 0) level = "low";

  return { leakAmount, level, ratio };
}

function calculateAgentPenalty(fraudScore: number, profitLeakAmount: number, leakLevel: string) {
  let penalty = 0;

  if (fraudScore >= 81) penalty += 20;
  else if (fraudScore >= 61) penalty += 12;
  else if (fraudScore >= 31) penalty += 5;

  if (leakLevel === "critical") penalty += 25;
  else if (leakLevel === "high") penalty += 15;
  else if (leakLevel === "medium") penalty += 8;

  if (profitLeakAmount > 100000) penalty += 10;

  return Math.min(100, penalty);
}

function validateEvidence(evidenceUrl: string, refundReason: string) {
  if (!evidenceUrl) {
    return {
      status: "missing",
      note: "No evidence URL attached. AI could not verify document proof.",
      scoreImpact: 15,
    };
  }

  const lower = evidenceUrl.toLowerCase();
  const looksImage = [".jpg", ".jpeg", ".png", ".webp"].some((x) => lower.includes(x));
  const looksPdf = lower.includes(".pdf");
  const looksDoc =
    lower.includes("refund") ||
    lower.includes("booking") ||
    lower.includes("policy") ||
    lower.includes("invoice") ||
    lower.includes("voucher") ||
    lower.includes("whatsapp");

  if (!looksImage && !looksPdf && !looksDoc) {
    return {
      status: "suspicious",
      note:
        "Evidence link does not look like a booking, policy, voucher, invoice, WhatsApp proof, image, or PDF document.",
      scoreImpact: 20,
    };
  }

  if (refundReason.length < 10) {
    return {
      status: "weak_reason",
      note: "Evidence exists but refund reason is too short for a confident AI review.",
      scoreImpact: 10,
    };
  }

  return {
    status: "passed_basic_check",
    note:
      "Basic evidence check passed. For real AI Vision validation, connect Supabase Edge Function or OpenAI Vision later.",
    scoreImpact: 0,
  };
}

function calculateFraudRisk(body: any, duplicateFound: boolean) {
  let score = 0;
  const reasons: string[] = [];

  const refundAmount = num(body.refund_amount);
  const supplierRecovery = num(body.supplier_recovery_amount);
  const netCustomerRefund = num(body.net_customer_refund);
  const evidenceUrl = str(body.evidence_url);
  const refundReason = str(body.refund_reason);

  const evidence = validateEvidence(evidenceUrl, refundReason);

  if (refundAmount > 100000) {
    score += 25;
    reasons.push("High refund amount");
  }

  if (!str(body.booking_ref)) {
    score += 35;
    reasons.push("Missing booking reference");
  }

  if (duplicateFound) {
    score += 35;
    reasons.push("Possible duplicate refund on same booking");
  }

  if (netCustomerRefund > refundAmount) {
    score += 25;
    reasons.push("Customer refund exceeds refund amount");
  }

  if (supplierRecovery <= 0 && refundAmount > 0) {
    score += 15;
    reasons.push("No supplier recovery recorded");
  }

  if (refundReason.length < 10) {
    score += 10;
    reasons.push("Weak refund reason");
  }

  if (["visa", "flight", "package"].includes(str(body.refund_type).toLowerCase()) && refundAmount > 50000) {
    score += 10;
    reasons.push("Sensitive product refund");
  }

  if (evidence.scoreImpact > 0) {
    score += evidence.scoreImpact;
    reasons.push(evidence.note);
  }

  return {
    score: Math.min(100, score),
    reasons: reasons.join(", ") || "Low-risk refund pattern",
    evidence,
  };
}

function buildAiReasonerSummary(input: {
  score: number;
  approval: string;
  riskReason: string;
  leakAmount: number;
  leakLevel: string;
  supplierRecovery: number;
  refundAmount: number;
  duplicateFound: boolean;
  evidenceStatus: string;
}) {
  const parts: string[] = [];

  parts.push(`Fraud score ${input.score}% with ${input.approval}.`);

  if (input.duplicateFound) {
    parts.push("Possible duplicate refund detected on the same booking reference.");
  }

  if (input.leakAmount > 0) {
    parts.push(
      `Profit leakage detected: ${input.leakLevel} leakage because supplier recovery is lower than refund amount.`
    );
  } else {
    parts.push("No direct profit leakage detected from supplier recovery gap.");
  }

  parts.push(`Evidence status: ${input.evidenceStatus}.`);
  parts.push(`Reason: ${input.riskReason}`);

  return parts.join(" ");
}

async function safeAudit(supabase: any, payload: any) {
  try {
    await supabase.from("refund_audit_logs").insert([payload]);
  } catch {
    // Optional table.
  }
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return jsonError("Supabase admin client not configured", 500);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const risk = searchParams.get("risk");

  let query = supabase
    .from("refund_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);

  if (risk === "critical") query = query.gte("fraud_risk_score", 81);
  if (risk === "high") query = query.gte("fraud_risk_score", 61).lt("fraud_risk_score", 81);
  if (risk === "watch") query = query.gte("fraud_risk_score", 31).lt("fraud_risk_score", 61);
  if (risk === "healthy") query = query.lt("fraud_risk_score", 31);

  const { data, error } = await query;

  if (error) return jsonError("Failed to fetch refunds", 500, error.message);

  const today = new Date();

  const refunds = (data || []).map((r: any) => {
    const agingDays =
      r.status?.includes("paid") && !r.supplier_reconciled
        ? daysBetween(r.paid_at || r.updated_at || r.created_at, today)
        : num(r.supplier_aging_days);

    const pendingAlert =
      r.status?.includes("paid") && !r.supplier_reconciled && agingDays >= 7;

    return {
      ...r,
      supplier_aging_days: agingDays,
      pending_reconciliation_alert: Boolean(r.pending_reconciliation_alert || pendingAlert),
    };
  });

  return jsonOk({
    refunds,
    count: refunds.length,
  });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return jsonError("Supabase admin client not configured", 500);

  const body = await req.json();

  const bookingRef = str(body.booking_ref);
  const refundAmount = num(body.refund_amount);
  const netCustomerRefund = num(body.net_customer_refund || body.refund_amount);
  const supplierRecovery = num(body.supplier_recovery_amount);

  if (!str(body.customer_name)) return jsonError("Customer name is required");
  if (!str(body.supplier_name)) return jsonError("Supplier name is required");
  if (refundAmount <= 0) return jsonError("Refund amount must be greater than zero");

  let duplicateFound = false;

  if (bookingRef) {
    const { data: existing } = await supabase
      .from("refund_requests")
      .select("id, refund_no, status")
      .eq("booking_ref", bookingRef)
      .neq("status", "rejected")
      .limit(1);

    duplicateFound = Array.isArray(existing) && existing.length > 0;
  }

  const fraud = calculateFraudRisk(body, duplicateFound);
  const level = approvalLevel(fraud.score);
  const refundNo = `RF-${Date.now()}`;

  const leak = calculateProfitLeak(refundAmount, supplierRecovery);
  const agentPenalty = calculateAgentPenalty(fraud.score, leak.leakAmount, leak.level);
  const commissionHold = fraud.score >= 61 || leak.level === "critical" || leak.level === "high";

  const aiSummary = buildAiReasonerSummary({
    score: fraud.score,
    approval: level,
    riskReason: fraud.reasons,
    leakAmount: leak.leakAmount,
    leakLevel: leak.level,
    supplierRecovery,
    refundAmount,
    duplicateFound,
    evidenceStatus: fraud.evidence.status,
  });

  const payload = {
    refund_no: refundNo,
    refund_type: str(body.refund_type) || "general",
    booking_ref: bookingRef || null,
    customer_name: str(body.customer_name),
    supplier_name: str(body.supplier_name),
    agent_name: str(body.agent_name) || null,
    refund_amount: refundAmount,
    supplier_recovery_amount: supplierRecovery,
    net_customer_refund: netCustomerRefund,
    refund_reason: str(body.refund_reason) || null,
    evidence_url: str(body.evidence_url) || null,

    status: fraud.score >= 31 ? "pending_approval" : "auto_approved",
    supplier_reconciled: false,

    fraud_risk_score: fraud.score,
    risk_reason: fraud.reasons,
    approval_required: fraud.score >= 31,
    approval_level: level,
    duplicate_warning: duplicateFound,

    profit_impact: leak.leakAmount,
    profit_leak_amount: leak.leakAmount,
    profit_leak_level: leak.level,

    commission_hold: commissionHold,
    agent_score_penalty: agentPenalty,
    agent_freeze_recommended: fraud.score >= 81 || agentPenalty >= 40,

    evidence_validation_status: fraud.evidence.status,
    evidence_validation_note: fraud.evidence.note,
    ai_reasoner_summary: aiSummary,

    supplier_reconciliation_due_date: addDaysIso(7),
    supplier_aging_days: 0,
    pending_reconciliation_alert: false,

    refund_stage: fraud.score >= 31 ? "created_pending_approval" : "created_auto_approved",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("refund_requests")
    .insert([payload])
    .select()
    .single();

  if (error) return jsonError("Refund create failed", 500, error.message);

  await safeAudit(supabase, {
    refund_id: data.id,
    action: "created",
    actor: "system",
    note: aiSummary,
    fraud_risk_score: fraud.score,
    profit_leak_amount: leak.leakAmount,
    created_at: new Date().toISOString(),
  });

  return jsonOk(
    {
      refund: data,
      fraud_risk_score: fraud.score,
      approval_level: level,
      approval_required: fraud.score >= 31,
      risk_reason: fraud.reasons,
      profit_leak_amount: leak.leakAmount,
      profit_leak_level: leak.level,
      agent_score_penalty: agentPenalty,
      ai_reasoner_summary: aiSummary,
    },
    201
  );
}