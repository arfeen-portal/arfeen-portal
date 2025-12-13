import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// -------------------- helpers --------------------
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

// -------------------- route --------------------
export async function POST(req: NextRequest) {
  try {
    // ✅ IMPORTANT: create client INSIDE handler (no build-time crash)
    const supabaseAdmin = getSupabaseAdmin();

    const body = await req.json();
    const batchId = body?.batchId;

    if (!batchId) {
      return NextResponse.json({ error: "batchId required" }, { status: 400 });
    }

    // 1) Get staging rows that are approved or suggested (you can adjust statuses)
    const { data: stagingRows, error: stagingError } = await (supabaseAdmin as any)
      .from("agent_import_staging")
      .select("*")
      .eq("batch_id", batchId)
      .in("status", ["approved", "suggested"]);

    if (stagingError) {
      console.error(stagingError);
      return NextResponse.json(
        { error: "Failed to load staging rows" },
        { status: 500 }
      );
    }

    if (!stagingRows || stagingRows.length === 0) {
      return NextResponse.json({ inserted: 0, updated: 0, total: 0 });
    }

    // 2) Build upsert payload for real agents table
    // NOTE: your agents schema does NOT have company_name (as you told earlier)
    const upsertAgents = (stagingRows as any[]).map((r) => ({
      tenant_id: r.tenant_id ?? null,
      name: r.raw_name ?? r.name ?? "",
      email: r.raw_email ?? r.email ?? null,
      phone: r.raw_phone ?? r.phone ?? null,
      country: r.country ?? null,
      city: r.city ?? null,
      agent_code: r.agent_code ?? null,
      status: r.status_final ?? "active",
      is_active: true,
      updated_at: new Date().toISOString(),
      // add more mapping if you have more staging fields
    }));

    // 3) Upsert into agents (by email OR agent_code depending on your system)
    // Here we use email if present; otherwise agent_code.
    // For mixed batches, do two passes.
    const withEmail = upsertAgents.filter((a: any) => a.email);
    const withoutEmail = upsertAgents.filter((a: any) => !a.email && a.agent_code);

    let upserted = 0;

    if (withEmail.length > 0) {
      const { error } = await (supabaseAdmin as any)
        .from("agents")
        .upsert(withEmail, { onConflict: "email" });
      if (error) {
        console.error(error);
        return NextResponse.json(
          { error: "Failed to upsert agents by email" },
          { status: 500 }
        );
      }
      upserted += withEmail.length;
    }

    if (withoutEmail.length > 0) {
      const { error } = await (supabaseAdmin as any)
        .from("agents")
        .upsert(withoutEmail, { onConflict: "agent_code" });
      if (error) {
        console.error(error);
        return NextResponse.json(
          { error: "Failed to upsert agents by agent_code" },
          { status: 500 }
        );
      }
      upserted += withoutEmail.length;
    }

    // 4) Mark staging rows as finalized
    const { error: markError } = await (supabaseAdmin as any)
      .from("agent_import_staging")
      .update({ status: "finalized", finalized_at: new Date().toISOString() })
      .eq("batch_id", batchId);

    if (markError) {
      console.error(markError);
      // not fatal, but report
    }

    // 5) Audit log
    const auditRow = {
      tenant_id: null,
      user_id: null,
      batch_id: batchId,
      action: "finalize",
      meta: { total: stagingRows.length, upserted },
    };

    await (supabaseAdmin as any).from("agent_import_audit_log").insert([auditRow]);

    return NextResponse.json({
      total: stagingRows.length,
      upserted,
      finalized: true,
    });
  } catch (e: any) {
    console.error("finalize route error:", e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
