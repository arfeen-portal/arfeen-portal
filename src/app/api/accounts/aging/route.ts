import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function n(v: any) {
  const x = Number(v || 0);
  return Number.isFinite(x) ? x : 0;
}

function calculateScore(row: any, brokenPromises = 0) {
  const overdue = n(row.overdue_days);
  const balance = n(row.balance_amount);

  const bucketPenalty: Record<string, number> = {
    current: 0,
    "1_30": 6,
    "31_60": 15,
    "61_90": 26,
    "90_plus": 40,
  };

  const amountPenalty =
    balance >= 1000000 ? 18 :
    balance >= 500000 ? 13 :
    balance >= 200000 ? 8 :
    balance >= 100000 ? 5 : 2;

  const brokenPenalty = Math.min(brokenPromises * 12, 36);

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          Math.min(overdue * 0.55, 45) -
          (bucketPenalty[row.aging_bucket] || 0) -
          amountPenalty -
          brokenPenalty
      )
    )
  );
}

function risk(score: number, bucket: string, brokenPromises: number) {
  if (brokenPromises >= 3) return "legal";
  if (bucket === "90_plus" || score < 35) return "critical";
  if (bucket === "61_90" || score < 55) return "high";
  if (bucket === "31_60" || score < 75) return "medium";
  return "low";
}

function provisionRate(riskLevel: string, bucket: string) {
  if (riskLevel === "legal") return 0.75;
  if (riskLevel === "critical" || bucket === "90_plus") return 0.45;
  if (riskLevel === "high") return 0.25;
  if (riskLevel === "medium") return 0.12;
  return 0.03;
}

function recoveryAction(row: any, score: number, brokenPromises: number) {
  if (brokenPromises >= 3) {
    return {
      action: "Legal/Litigation Alert",
      channel: "Management Alert + Credit Block",
      urgency: "Immediate",
      tone: "Legal Notice Mode",
      ai_note: "Habitual broken promises detected. Legal review and blacklist recommendation triggered.",
    };
  }

  if (row.aging_bucket === "90_plus" || score < 35) {
    return {
      action: "Freeze credit + call decision maker",
      channel: "Call + WhatsApp + SOA",
      urgency: "Immediate",
      tone: "Strict Finance Mode",
      ai_note: "High default probability. Stop further credit and collect written payment commitment.",
    };
  }

  if (row.aging_bucket === "61_90" || n(row.balance_amount) > 500000) {
    return {
      action: "Negotiate partial payment",
      channel: "WhatsApp + Email",
      urgency: "Today",
      tone: "Negotiation Recovery",
      ai_note: "Secure partial payment first, then convert remaining balance into dated commitment.",
    };
  }

  if (row.aging_bucket === "31_60") {
    return {
      action: "Soft reminder with deadline",
      channel: "WhatsApp",
      urgency: "24 hours",
      tone: "Soft Professional",
      ai_note: "Medium risk. Relationship-friendly reminder is suitable before escalation.",
    };
  }

  return {
    action: "Normal reminder cycle",
    channel: "Auto Reminder",
    urgency: "Low",
    tone: "Friendly",
    ai_note: "Healthy account. Keep standard follow-up active.",
  };
}

export async function GET(req: Request) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase admin client not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenant_id") || "";
  const search = (searchParams.get("search") || "").toLowerCase();
  const bucket = searchParams.get("bucket") || "all";
  const riskFilter = searchParams.get("risk") || "all";

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: "tenant_id is required." },
      { status: 400 }
    );
  }

  let q = supabase
    .from("v_agent_aging")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("overdue_days", { ascending: false });

  if (bucket !== "all") q = q.eq("aging_bucket", bucket);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const invoiceNos = (data || []).map((r: any) => r.invoice_no).filter(Boolean);

  const { data: promises } = await supabase
    .from("finance_recovery_promises")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("invoice_no", invoiceNos.length ? invoiceNos : ["__none__"])
    .order("created_at", { ascending: false });

  const promiseMap = new Map<string, any[]>();
  for (const p of promises || []) {
    const arr = promiseMap.get(p.invoice_no) || [];
    arr.push(p);
    promiseMap.set(p.invoice_no, arr);
  }

  let aging = (data || []).map((row: any) => {
    const history = promiseMap.get(row.invoice_no) || [];
    const latestPromise = history[0] || null;
    const brokenPromises = history.filter((p) => p.status === "broken").length;

    const propensity_score = calculateScore(row, brokenPromises);
    const risk_level = risk(propensity_score, row.aging_bucket, brokenPromises);
    const provision_rate = provisionRate(risk_level, row.aging_bucket);
    const estimated_bad_debt = Math.round(n(row.balance_amount) * provision_rate);
    const recovery_probability = Math.max(3, propensity_score - Math.round(n(row.overdue_days) * 0.15));

    return {
      ...row,
      promise_history: history,
      latest_promise: latestPromise,
      promise_status: latestPromise?.status || null,
      promised_date: latestPromise?.promised_date || null,
      broken_promises: brokenPromises,
      propensity_score,
      risk_level,
      provision_rate,
      estimated_bad_debt,
      recovery_probability,
      timeline: [
        { label: "Today", probability: recovery_probability },
        { label: "30 Days", probability: Math.max(3, recovery_probability - 18) },
        { label: "60 Days", probability: Math.max(2, recovery_probability - 35) },
        { label: "90 Days", probability: Math.max(1, recovery_probability - 55) },
      ],
      ...recoveryAction(row, propensity_score, brokenPromises),
    };
  });

  if (search) {
    aging = aging.filter((r: any) =>
      [r.invoice_no, r.agent_name, r.customer_name, r.agent_code, r.phone]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }

  if (riskFilter !== "all") aging = aging.filter((r: any) => r.risk_level === riskFilter);

  const rank: any = { legal: 0, critical: 1, high: 2, medium: 3, low: 4 };

  aging.sort((a: any, b: any) => {
    return rank[a.risk_level] - rank[b.risk_level] || n(b.balance_amount) - n(a.balance_amount);
  });

  const summary = aging.reduce(
    (acc: any, r: any) => {
      acc.total_balance += n(r.balance_amount);
      acc.estimated_bad_debt += n(r.estimated_bad_debt);
      acc.total_invoices += 1;
      acc.avg_score += n(r.propensity_score);
      acc.legal += r.risk_level === "legal" ? 1 : 0;
      acc.critical += r.risk_level === "critical" ? 1 : 0;
      acc.high += r.risk_level === "high" ? 1 : 0;
      acc.promised += r.promise_status === "promised" ? 1 : 0;
      acc.broken += r.promise_status === "broken" ? 1 : 0;
      acc.verified += r.promise_status === "verified" ? 1 : 0;
      return acc;
    },
    {
      total_balance: 0,
      estimated_bad_debt: 0,
      total_invoices: 0,
      avg_score: 0,
      legal: 0,
      critical: 0,
      high: 0,
      promised: 0,
      broken: 0,
      verified: 0,
    }
  );

  summary.avg_score = summary.total_invoices
    ? Math.round(summary.avg_score / summary.total_invoices)
    : 0;

  return NextResponse.json({ success: true, summary, aging });
}