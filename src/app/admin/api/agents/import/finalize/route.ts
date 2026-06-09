import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const batchId = body.batchId;

    if (!batchId) {
      return NextResponse.json(
        { error: "batchId required" },
        { status: 400 }
      );
    }

    const { data: stagingRows, error: stagingError } = await supabase
      .from("agent_import_staging")
      .select("*")
      .eq("batch_id", batchId);

    if (stagingError) {
      return NextResponse.json(
        { error: stagingError.message },
        { status: 500 }
      );
    }

    if (!stagingRows || stagingRows.length === 0) {
      return NextResponse.json({ total: 0, upserted: 0 });
    }

    const payload = stagingRows.map((r: any) => ({
      name: r.raw_name,
      email: r.raw_email,
      agent_code: r.agent_code,
      status: "active",
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("agents")
      .upsert(payload, { onConflict: "agent_code" });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    await supabase
      .from("agent_import_staging")
      .update({ status: "finalized" })
      .eq("batch_id", batchId);

    return NextResponse.json({
      total: stagingRows.length,
      upserted: payload.length,
      finalized: true,
    });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}