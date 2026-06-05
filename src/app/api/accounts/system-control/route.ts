import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        error: "Supabase admin client not configured",
        data: {
          systemHealth: [],
          controls: [],
          alerts: [],
        },
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      module: "Accounts System Control",
      status: "ready",
      controls: [
        "Voucher Locking",
        "Period Closing",
        "Ledger Safety",
        "Rollback Control",
        "Audit Monitoring",
      ],
      alerts: [],
    },
  });
}