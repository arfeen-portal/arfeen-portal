import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { getTenantIdFromRequest } from "@/lib/api/finance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: string | null) {
  return value?.trim() || "";
}

function getSafePage(value: string | null) {
  const page = Number(value || 1);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function getSafePageSize(value: string | null) {
  const size = Number(value || 25);
  if (!Number.isFinite(size)) return 25;
  return Math.min(Math.max(size, 10), 100);
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error: "Supabase admin client not configured",
        },
        { status: 500 }
      );
    }

    // ===== EXISTING PORTAL PATTERN =====
    let tenantId = getTenantIdFromRequest(req);

    /**
     * DEV FALLBACK
     * localhost pe tenant header nahi hota
     * is liye first tenant اٹھا لو
     */
    if (!tenantId) {
      const { data: firstTenant } = await supabase
        .from("tenants")
        .select("id")
        .limit(1)
        .single();

      tenantId = firstTenant?.id || null;
    }

    if (!tenantId) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Tenant not found. Please create tenant or check tenant mapping.",
        },
        { status: 400 }
      );
    }

    // ===== QUERY PARAMS =====
    const { searchParams } = new URL(req.url);

    const search = clean(searchParams.get("search"));
    const status = clean(searchParams.get("status")) || "all";

    const page = getSafePage(searchParams.get("page"));
    const pageSize = getSafePageSize(searchParams.get("pageSize"));

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // ===== QUERY =====
    let query = supabase
      .from("finance_vouchers")
      .select("*", { count: "exact" })
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `voucher_no.ilike.%${search}%,description.ilike.%${search}%,reference_no.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const rows = data || [];

    const summary = rows.reduce(
      (acc, row: any) => {
        acc.totalDebit += Number(row.total_debit || 0);
        acc.totalCredit += Number(row.total_credit || 0);
        return acc;
      },
      {
        totalDebit: 0,
        totalCredit: 0,
      }
    );

    const total = count || 0;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    return NextResponse.json({
      ok: true,
      data: rows,
      summary: {
        totalDebit: summary.totalDebit,
        totalCredit: summary.totalCredit,
        balance: summary.totalDebit - summary.totalCredit,
        count: rows.length,
      },
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Unexpected server error",
      },
      { status: 500 }
    );
  }
}