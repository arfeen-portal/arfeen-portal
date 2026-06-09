import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { requireAccountant } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function monthStart(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    1
  )
    .toISOString()
    .slice(0, 10);
}

function monthEnd(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return new Date(
    d.getFullYear(),
    d.getMonth() + 1,
    0
  )
    .toISOString()
    .slice(0, 10);
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      ok: false,
      error: message,
    },
    { status }
  );
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAccountant();

    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return jsonError("Supabase admin not configured", 500);
    }

    const tenantId = authUser.tenantId;
    const isGlobalAdmin =
      authUser.role === "super_admin" ||
      authUser.role === "admin";

    if (!tenantId && !isGlobalAdmin) {
      return jsonError(
        "Tenant not assigned to this user.",
        403
      );
    }

    const { searchParams } = new URL(req.url);

    const from =
      searchParams.get("from") || monthStart();

    const to =
      searchParams.get("to") || monthEnd();

    let query = supabase
      .from("v_ledger")
      .select("*")
      .gte("voucher_date", from)
      .lte("voucher_date", to);

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const rows = data || [];

    const incomeRows = rows
      .filter((r: any) =>
        ["income", "revenue"].includes(
          String(r.account_type || "").toLowerCase()
        )
      )
      .map((r: any) => ({
        account_code: r.account_code || "",
        account_name: r.account_name || "",
        amount:
          Number(r.credit || 0) -
          Number(r.debit || 0),
      }));

    const expenseRows = rows
      .filter((r: any) =>
        [
          "expense",
          "expenses",
          "cost_of_sales",
          "cost",
        ].includes(
          String(r.account_type || "").toLowerCase()
        )
      )
      .map((r: any) => ({
        account_code: r.account_code || "",
        account_name: r.account_name || "",
        amount:
          Number(r.debit || 0) -
          Number(r.credit || 0),
      }));

    const groupedIncome = Object.values(
      incomeRows.reduce(
        (acc: Record<string, any>, row: any) => {
          const key = `${row.account_code}-${row.account_name}`;
          acc[key] = acc[key] || {
            ...row,
            amount: 0,
          };
          acc[key].amount += Number(
            row.amount || 0
          );
          return acc;
        },
        {}
      )
    );

    const groupedExpenses = Object.values(
      expenseRows.reduce(
        (acc: Record<string, any>, row: any) => {
          const key = `${row.account_code}-${row.account_name}`;
          acc[key] = acc[key] || {
            ...row,
            amount: 0,
          };
          acc[key].amount += Number(
            row.amount || 0
          );
          return acc;
        },
        {}
      )
    );

    const totalIncome = (
      groupedIncome as any[]
    ).reduce(
      (sum, row) =>
        sum + Number(row.amount || 0),
      0
    );

    const totalExpense = (
      groupedExpenses as any[]
    ).reduce(
      (sum, row) =>
        sum + Number(row.amount || 0),
      0
    );

    const netProfit =
      totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      ok: true,
      from,
      to,
      totalIncome,
      totalExpense,
      netProfit,
      income: groupedIncome,
      expenses: groupedExpenses,
      tenant_id: tenantId,
      role: authUser.role,
      scope: tenantId
        ? "tenant"
        : "global_admin",
    });
  } catch (error: any) {
    return jsonError(
      error?.message ||
        "Failed to fetch profit & loss",
      500
    );
  }
}