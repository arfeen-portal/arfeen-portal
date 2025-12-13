import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// ---------------- helpers ----------------
function normalizeUrl(v?: string) {
  if (!v) return "";
  return v.trim().replace(/^"|"$/g, "").replace(/\/+$/, "");
}

function getSupabaseAdmin() {
  const supabaseUrl = normalizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

  if (!supabaseUrl) throw new Error("supabaseUrl is required");
  if (!/^https?:\/\/.+/i.test(supabaseUrl)) {
    throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL");
  }
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");

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
    const supabaseAdmin = getSupabaseAdmin();
    const { batchId } = await req.json();

    if (!batchId) {
      return NextResponse.json({ error: "batchId required" }, { status: 400 });
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

    // 2) Audit log
    await (supabaseAdmin as any)
      .from("agent_import_audit_log")
      .insert([
        {
          tenant_id: null,
          user_id: null,
          batch_id: batchId,
          action: "rollback",
          meta: {},
        },
      ]);

    return NextResponse.json({ rolled_back: true });
  } catch (e: any) {
    console.error("rollback route error:", e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
