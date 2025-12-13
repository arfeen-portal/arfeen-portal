import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ---------------- helpers ----------------
function normalizeUrl(v?: string) {
  if (!v) return "";
  return v.trim().replace(/^"|"$/g, "").replace(/\/+$/, "");
}

/**
 * SAFE admin client (NO throw → build safe)
 */
function getSupabaseAdminSafe() {
  const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  // ❗ NEVER throw (build safe)
  if (!supabaseUrl || !/^https?:\/\//i.test(supabaseUrl) || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

// ---------------- route ----------------
export async function POST(req: NextRequest) {
  try {
    // ✅ correct helper name
    const supabaseAdmin = getSupabaseAdminSafe();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase env not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const batchId = body?.batchId;

    if (!batchId) {
      return NextResponse.json(
        { error: "batchId required" },
        { status: 400 }
      );
    }

    // 1) Revert staging rows
    const { error: resetError } = await (supabaseAdmin as any)
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

    // 2) Audit log (ARRAY insert)
    const auditRow = {
      tenant_id: null,
      user_id: null,
      batch_id: batchId,
      action: "rollback",
      meta: {},
    };

    const { error: auditError } = await (supabaseAdmin as any)
      .from("agent_import_audit_log")
      .insert([auditRow]);

    if (auditError) {
      console.error("audit insert error:", auditError);
      // non-fatal
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
