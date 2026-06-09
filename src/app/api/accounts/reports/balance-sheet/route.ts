import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { requireAccountant } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const authUser =
      await requireAccountant();

    const supabase =
      getSupabaseAdminSafe();

    if (!supabase) {
      return jsonError(
        "Supabase admin not configured",
        500
      );
    }

    const tenantId =
      authUser.tenantId;

    const isGlobalAdmin =
      authUser.role ===
        "super_admin" ||
      authUser.role === "admin";

    if (!tenantId && !isGlobalAdmin) {
      return jsonError(
        "Tenant not assigned to this user.",
        403
      );
    }

    let query = supabase
      .from("v_account_balances")
      .select("*");

    if (tenantId) {
      query = query.eq(
        "tenant_id",
        tenantId
      );
    }

    const { data, error } =
      await query;

    if (error) {
      throw error;
    }

    const rows = data || [];

    const assets = rows.filter(
      (r: any) =>
        ["asset", "assets"].includes(
          String(
            r.account_type || ""
          ).toLowerCase()
        )
    );

    const liabilities =
      rows.filter((r: any) =>
        [
          "liability",
          "liabilities",
        ].includes(
          String(
            r.account_type || ""
          ).toLowerCase()
        )
      );

    const equity = rows.filter(
      (r: any) =>
        ["equity"].includes(
          String(
            r.account_type || ""
          ).toLowerCase()
        )
    );

    const totalAssets =
      assets.reduce(
        (
          sum: number,
          row: any
        ) =>
          sum +
          Number(
            row.balance || 0
          ),
        0
      );

    const totalLiabilities =
      liabilities.reduce(
        (
          sum: number,
          row: any
        ) =>
          sum +
          Number(
            row.balance || 0
          ),
        0
      );

    const totalEquity =
      equity.reduce(
        (
          sum: number,
          row: any
        ) =>
          sum +
          Number(
            row.balance || 0
          ),
        0
      );

    return NextResponse.json({
      success: true,
      ok: true,
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      balanced:
        Number(
          totalAssets.toFixed(2)
        ) ===
        Number(
          (
            totalLiabilities +
            totalEquity
          ).toFixed(2)
        ),
      tenant_id: tenantId,
      role: authUser.role,
      scope: tenantId
        ? "tenant"
        : "global_admin",
    });
  } catch (error: any) {
    return jsonError(
      error?.message ||
        "Failed to fetch balance sheet",
      500
    );
  }
}