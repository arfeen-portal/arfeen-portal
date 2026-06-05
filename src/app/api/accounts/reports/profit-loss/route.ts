import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function monthStart(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function monthEnd(dateStr?: string) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenant_id");
    const from = searchParams.get("from") || monthStart();
    const to = searchParams.get("to") || monthEnd();

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenant_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("v_ledger")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("voucher_date", from)
      .lte("voucher_date", to);

    if (error) {
      throw error;
    }

    const rows = data || [];

    const incomeRows = rows
      .filter((r: any) =>
        ["income", "revenue"].includes(String(r.account_type || "").toLowerCase())
      )
      .map((r: any) => ({
        account_code: r.account_code || "",
        account_name: r.account_name || "",
        amount: Number(r.credit || 0) - Number(r.debit || 0),
      }));

    const expenseRows = rows
      .filter((r: any) =>
        ["expense", "expenses", "cost_of_sales", "cost"].includes(
          String(r.account_type || "").toLowerCase()
        )
      )
      .map((r: any) => ({
        account_code: r.account_code || "",
        account_name: r.account_name || "",
        amount: Number(r.debit || 0) - Number(r.credit || 0),
      }));

    const groupedIncome = Object.values(
      incomeRows.reduce((acc: Record<string, any>, row: any) => {
        const key = `${row.account_code}-${row.account_name}`;
        acc[key] = acc[key] || { ...row, amount: 0 };
        acc[key].amount += Number(row.amount || 0);
        return acc;
      }, {})
    );

    const groupedExpenses = Object.values(
      expenseRows.reduce((acc: Record<string, any>, row: any) => {
        const key = `${row.account_code}-${row.account_name}`;
        acc[key] = acc[key] || { ...row, amount: 0 };
        acc[key].amount += Number(row.amount || 0);
        return acc;
      }, {})
    );

    const totalIncome = (groupedIncome as any[]).reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );

    const totalExpense = (groupedExpenses as any[]).reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );

    const netProfit = totalIncome - totalExpense;

    return NextResponse.json({
      success: true,
      from,
      to,
      totalIncome,
      totalExpense,
      netProfit,
      income: groupedIncome,
      expenses: groupedExpenses,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch profit & loss" },
      { status: 500 }
    );
  }
}