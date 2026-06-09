import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Severity = "ok" | "watch" | "critical";

type TrialBalanceViewRow = {
  account_id: string | null;
  account_code: string | null;
  account_name: string | null;
  account_type: string | null;
  debit: number | string | null;
  credit: number | string | null;
  balance: number | string | null;
};

function toNumber(value: unknown): number {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function clean(value: unknown): string {
  return String(value || "").trim();
}

function cleanType(value: unknown): string {
  return clean(value || "other").toLowerCase() || "other";
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function isAbnormalNaturalBalance(accountType: string, balance: number): boolean {
  const type = cleanType(accountType);

  if (["asset", "expense"].includes(type) && balance < -0.01) return true;
  if (["liability", "equity", "revenue", "income"].includes(type) && balance > 0.01) return true;

  return false;
}

function buildDiagnostics(row: {
  account_id: string | null;
  account_code: string;
  account_name: string;
  account_type: string;
  debit: number;
  credit: number;
  balance: number;
}) {
  const flags: string[] = [];
  let severity: Severity = "ok";

  const totalMovement = Math.abs(row.debit) + Math.abs(row.credit);
  const hasMovement = totalMovement > 0.01;

  if (!row.account_id) {
    flags.push("Missing Account Link");
    severity = "critical";
  }

  if (!row.account_code || row.account_code === "-") {
    flags.push("Missing Account Code");
    severity = "watch";
  }

  if (!row.account_name || row.account_name === "Unnamed Account") {
    flags.push("Missing Account Name");
    severity = "watch";
  }

  if (isAbnormalNaturalBalance(row.account_type, row.balance)) {
    flags.push("Abnormal Natural Balance");
    severity = "critical";
  }

  if (row.debit > 0.01 && row.credit > 0.01 && Math.abs(row.balance) <= totalMovement * 0.05) {
    flags.push("High Contra Movement");
    if (severity !== "critical") severity = "watch";
  }

  if (!hasMovement) {
    flags.push("Zero Movement");
    if (severity !== "critical") severity = "watch";
  }

  if (Math.abs(row.balance) >= 500000) {
    flags.push("Large Balance Exposure");
    if (severity !== "critical") severity = "watch";
  }

  if (!flags.length) {
    flags.push("Healthy");
  }

  return {
    diagnostic_flags: flags,
    severity,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error: "Supabase admin client not configured",
          data: [],
          summary: null,
        },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("v_trial_balance_summary")
      .select("account_id, account_code, account_name, account_type, debit, credit, balance")
      .order("account_code", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          hint:
            "Run the SQL patch that creates public.v_trial_balance_summary and public.v_trial_balance_ledger.",
          data: [],
          summary: null,
        },
        { status: 500 }
      );
    }

    const rows = ((data || []) as TrialBalanceViewRow[]).map((item) => {
      const debit = round2(toNumber(item.debit));
      const credit = round2(toNumber(item.credit));
      const balance = round2(toNumber(item.balance));

      const baseRow = {
        account_id: item.account_id ? clean(item.account_id) : null,
        account_code: clean(item.account_code) || "-",
        account_name: clean(item.account_name) || "Unnamed Account",
        account_type: cleanType(item.account_type),
        debit,
        credit,
        balance,
      };

      const diagnostics = buildDiagnostics(baseRow);

      return {
        ...baseRow,
        ...diagnostics,
      };
    });

    const totalDebit = round2(rows.reduce((sum, row) => sum + row.debit, 0));
    const totalCredit = round2(rows.reduce((sum, row) => sum + row.credit, 0));
    const difference = round2(totalDebit - totalCredit);

    const abnormalCount = rows.filter((row) =>
      row.diagnostic_flags.includes("Abnormal Natural Balance")
    ).length;

    const zeroMovementCount = rows.filter((row) =>
      row.diagnostic_flags.includes("Zero Movement")
    ).length;

    const criticalCount = rows.filter((row) => row.severity === "critical").length;
    const watchCount = rows.filter((row) => row.severity === "watch").length;
    const healthyCount = rows.filter((row) => row.severity === "ok").length;

    return NextResponse.json({
      ok: true,
      data: rows,
      summary: {
        total_debit: totalDebit,
        total_credit: totalCredit,
        difference,
        is_balanced: Math.abs(difference) <= 0.01,
        abnormal_count: abnormalCount,
        zero_movement_count: zeroMovementCount,
        critical_count: criticalCount,
        watch_count: watchCount,
        healthy_count: healthyCount,
        account_count: rows.length,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Internal Server Error",
        data: [],
        summary: null,
      },
      { status: 500 }
    );
  }
}