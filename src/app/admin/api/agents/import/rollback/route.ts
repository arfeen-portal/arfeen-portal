import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // ✅ single, correct server/admin client
    const supabase = supabaseAdminSafe;

    const body = await req.json();
    const batchId = body.batchId;

    if (!batchId) {
      return NextResponse.json(
        { error: "batchId required" },
        { status: 400 }
      );
    }

    // 1️⃣ Rollback staging rows
    const { error: resetError } = await supabase
      .from("agent_import_staging")
      .update({
        matched_agent_id: null,
        match_score: null,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("batch_id", batchId);

    if (resetError) {
      console.error(resetError);
      return NextResponse.json(
        { error: "Failed to rollback staging rows" },
        { status: 500 }
      );
    }

    // 2️⃣ Audit log (non-fatal)
    const auditRow = {
      tenant_id: null,
      user_id: null,
      batch_id: batchId,
      action: "rollback",
      meta: {},
    };

    const { error: auditError } = await supabase
      .from("agent_import_audit_log")
      .insert([auditRow]);

    if (auditError) {
      console.error("audit insert error", auditError);
      // intentionally non-fatal
    }

    return NextResponse.json({ rolled_back: true });
  } catch (e: any) {
    console.error("rollback route error:", e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
