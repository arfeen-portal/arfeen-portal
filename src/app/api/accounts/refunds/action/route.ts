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

function daysBetween(from?: string | null, to = new Date()) {
  if (!from) return 0;

  const start = new Date(from);
  if (Number.isNaN(start.getTime())) return 0;

  const diff = to.getTime() - start.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
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

function validateEvidence(evidenceUrl?: string | null, refundReason?: string | null) {
  const url = String(evidenceUrl || "").toLowerCase();
  const reason = String(refundReason || "");

  if (!url) {
    return {
      status: "missing",
      note: "No evidence URL attached. AI could not verify refund proof.",
      scoreImpact: 15,
    };
  }

  const looksImage = [".jpg", ".jpeg", ".png", ".webp"].some((x) => url.includes(x));
  const looksPdf = url.includes(".pdf");
  const looksDoc =
    url.includes("refund") ||
    url.includes("booking") ||
    url.includes("policy") ||
    url.includes("invoice") ||
    url.includes("voucher") ||
    url.includes("whatsapp");

  if (!looksImage && !looksPdf && !looksDoc) {
    return {
      status: "suspicious",
      note:
        "Evidence link does not look like a refund policy, booking document, voucher, invoice, WhatsApp proof, PDF, or image.",
      scoreImpact: 20,
    };
  }

  if (reason.length < 10) {
    return {
      status: "weak_reason",
      note: "Evidence exists but refund reason is too short for a confident review.",
      scoreImpact: 10,
    };
  }

  return {
    status: "passed_basic_check",
    note:
      "Basic evidence validation passed. Real image/document intelligence can be connected later through Supabase Edge Function or OpenAI Vision.",
    scoreImpact: 0,
  };
}

function buildAiReasonerSummary(refund: any, evidence: any) {
  const refundAmount = num(refund.refund_amount);
  const supplierRecovery = num(refund.supplier_recovery_amount);
  const leak = calculateProfitLeak(refundAmount, supplierRecovery);

  const parts: string[] = [];

  parts.push(`Fraud score is ${num(refund.fraud_risk_score)}%.`);

  if (leak.leakAmount > 0) {
    parts.push(
      `Profit leak is ${leak.level}: refund amount is higher than supplier recovery by PKR ${leak.leakAmount.toLocaleString(
        "en-PK"
      )}.`
    );
  } else {
    parts.push("No supplier recovery gap detected.");
  }

  if (refund.duplicate_warning) {
    parts.push("Duplicate refund warning exists on this booking reference.");
  }

  if (refund.pending_reconciliation_alert) {
    parts.push("Supplier reconciliation is overdue and should be recovered immediately.");
  }

  parts.push(`Evidence status: ${evidence.status}. ${evidence.note}`);

  return parts.join(" ");
}

async function audit(supabase: any, payload: any) {
  try {
    await supabase.from("refund_audit_logs").insert([payload]);
  } catch {
    // Optional audit table.
  }
}

async function createRefundPaymentVoucher(supabase: any, refund: any, actor: string) {
  const now = new Date().toISOString();
  const voucherNo = `RV-${Date.now()}`;
  const amount = num(refund.net_customer_refund || refund.refund_amount);

  const voucherPayload = {
    voucher_no: voucherNo,
    voucher_type: "refund_payment",
    voucher_date: now.slice(0, 10),
    narration: `Auto refund payment voucher for ${refund.refund_no} / ${
      refund.booking_ref || "No booking ref"
    }`,
    status: "posted",
    total_debit: amount,
    total_credit: amount,
    source_type: "refund",
    source_id: refund.id,
    created_by: actor || "system",
    created_at: now,
    updated_at: now,
  };

  const { data: voucher, error: voucherError } = await supabase
    .from("finance_vouchers")
    .insert([voucherPayload])
    .select()
    .single();

  if (voucherError) throw new Error(`Voucher create failed: ${voucherError.message}`);

  const lines = [
    {
      voucher_id: voucher.id,
      line_no: 1,
      account_name: "Refunds Payable",
      description: `Refund payable reversal: ${refund.refund_no}`,
      debit: amount,
      credit: 0,
      created_at: now,
    },
    {
      voucher_id: voucher.id,
      line_no: 2,
      account_name: "Cash / Bank",
      description: `Refund paid to customer: ${refund.customer_name}`,
      debit: 0,
      credit: amount,
      created_at: now,
    },
  ];

  const { error: lineError } = await supabase.from("finance_voucher_lines").insert(lines);

  if (lineError) throw new Error(`Voucher lines create failed: ${lineError.message}`);

  return voucher;
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return jsonError("Supabase admin client not configured", 500);

  const { refund_id, action, actor, note } = await req.json();

  if (!refund_id) return jsonError("refund_id is required");
  if (!action) return jsonError("action is required");

  const { data: refund, error: fetchError } = await supabase
    .from("refund_requests")
    .select("*")
    .eq("id", refund_id)
    .single();

  if (fetchError || !refund) return jsonError("Refund not found", 404, fetchError?.message);

  const now = new Date().toISOString();

  const refundAmount = num(refund.refund_amount);
  const supplierRecovery = num(refund.supplier_recovery_amount);
  const leak = calculateProfitLeak(refundAmount, supplierRecovery);
  const agentPenalty = calculateAgentPenalty(
    num(refund.fraud_risk_score),
    leak.leakAmount,
    leak.level
  );

  const supplierAgingDays =
    refund.status?.includes("paid") && !refund.supplier_reconciled
      ? daysBetween(refund.paid_at || refund.updated_at || refund.created_at)
      : num(refund.supplier_aging_days);

  const pendingReconciliation =
    refund.status?.includes("paid") && !refund.supplier_reconciled && supplierAgingDays >= 7;

  let updatePayload: any = {
    updated_at: now,
    profit_impact: leak.leakAmount,
    profit_leak_amount: leak.leakAmount,
    profit_leak_level: leak.level,
    agent_score_penalty: agentPenalty,
    supplier_aging_days: supplierAgingDays,
    pending_reconciliation_alert: pendingReconciliation,
  };

  let voucher: any = null;

  if (action === "approve") {
    updatePayload = {
      ...updatePayload,
      status: "approved",
      refund_stage: "approved",
      approved_by: actor || "admin",
      approved_at: now,
    };
  }

  if (action === "reject") {
    updatePayload = {
      ...updatePayload,
      status: "rejected",
      refund_stage: "rejected",
      rejected_by: actor || "admin",
      rejected_at: now,
      rejection_note: note || null,
    };
  }

  if (action === "mark_paid") {
    if (!["approved", "auto_approved"].includes(refund.status)) {
      return jsonError("Refund must be approved before marking paid", 409);
    }

    voucher = await createRefundPaymentVoucher(supabase, refund, actor || "system");

    updatePayload = {
      ...updatePayload,
      status: "paid",
      refund_stage:
        leak.leakAmount > 0
          ? "customer_paid_ledger_posted_profit_leak_detected"
          : "customer_paid_ledger_posted",
      paid_at: now,
      payment_voucher_id: voucher.id,
      supplier_reconciliation_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
      supplier_aging_days: 0,
      pending_reconciliation_alert: false,
      commission_hold:
        refund.commission_hold || leak.level === "critical" || leak.level === "high",
      agent_freeze_recommended:
        refund.agent_freeze_recommended || leak.level === "critical" || agentPenalty >= 40,
    };
  }

  if (action === "reconcile_supplier") {
    updatePayload = {
      ...updatePayload,
      supplier_reconciled: true,
      status: refund.status === "paid" ? "paid_supplier_reconciled" : refund.status,
      refund_stage: "supplier_reconciled",
      reconciled_at: now,
      supplier_aging_days: 0,
      pending_reconciliation_alert: false,
    };
  }

  if (action === "hold_commission") {
    updatePayload = {
      ...updatePayload,
      commission_hold: true,
      refund_stage: "commission_hold_active",
    };
  }

  if (action === "release_commission") {
    updatePayload = {
      ...updatePayload,
      commission_hold: false,
      refund_stage: "commission_released",
    };
  }

  if (action === "freeze_agent") {
    updatePayload = {
      ...updatePayload,
      agent_freeze_recommended: true,
      commission_hold: true,
      refund_stage: "agent_freeze_recommended",
    };
  }

  if (action === "run_ai_review") {
    const evidence = validateEvidence(refund.evidence_url, refund.refund_reason);
    const aiSummary = buildAiReasonerSummary(
      {
        ...refund,
        profit_leak_amount: leak.leakAmount,
        profit_leak_level: leak.level,
        supplier_aging_days: supplierAgingDays,
        pending_reconciliation_alert: pendingReconciliation,
      },
      evidence
    );

    const newRisk = Math.min(100, num(refund.fraud_risk_score) + evidence.scoreImpact);

    updatePayload = {
      ...updatePayload,
      fraud_risk_score: newRisk,
      evidence_validation_status: evidence.status,
      evidence_validation_note: evidence.note,
      ai_reasoner_summary: aiSummary,
      approval_required: newRisk >= 31,
      approval_level:
        newRisk >= 81
          ? "owner_approval"
          : newRisk >= 61
          ? "admin_approval"
          : newRisk >= 31
          ? "accountant_approval"
          : "auto_approval",
      commission_hold:
        refund.commission_hold || newRisk >= 61 || leak.level === "critical" || leak.level === "high",
      agent_freeze_recommended:
        refund.agent_freeze_recommended || newRisk >= 81 || leak.level === "critical",
      refund_stage: "ai_review_completed",
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("refund_requests")
    .update(updatePayload)
    .eq("id", refund_id)
    .select()
    .single();

  if (updateError) return jsonError("Refund action failed", 500, updateError.message);

  await audit(supabase, {
    refund_id,
    action,
    actor: actor || "system",
    note:
      note ||
      `Action ${action}. Profit leak: ${leak.level}, PKR ${leak.leakAmount}. Supplier aging: ${supplierAgingDays} days.`,
    fraud_risk_score: updated.fraud_risk_score || 0,
    profit_leak_amount: leak.leakAmount,
    created_at: now,
  });

  return jsonOk({
    success: true,
    refund: updated,
    voucher,
    profit_leak_amount: leak.leakAmount,
    profit_leak_level: leak.level,
    supplier_aging_days: supplierAgingDays,
    pending_reconciliation_alert: pendingReconciliation,
  });
}