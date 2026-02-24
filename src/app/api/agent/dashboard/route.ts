import { NextRequest, NextResponse } from "next/server";
import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    // Runtime safety
    const supabase = supabaseAdmin;

    if (!supabase) {
      return NextResponse.json(
        { error: "SERVICE_UNAVAILABLE" },
        { status: 503 }
      );
    }

    const ctx = await withAgent(req as any);

    if (!ctx?.tenant_id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { count, error } = await supabase
      .from("transport_bookings")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", ctx.tenant_id);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Query failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookings: count ?? 0,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}