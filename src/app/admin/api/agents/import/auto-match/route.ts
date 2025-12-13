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

// Simple phonetic-ish normalize
function normalizeName(input: string): string {
  if (!input) return "";
  const cleaned = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.replace(/(.)\1+/g, "$1");
}

// Levenshtein
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function similarity(a: string, b: string): number {
  const nA = normalizeName(a);
  const nB = normalizeName(b);
  const maxLen = Math.max(nA.length, nB.length);
  if (!maxLen) return 0;
  const dist = levenshtein(nA, nB);
  return (maxLen - dist) / maxLen;
}

// -------------------- route --------------------
export async function POST(req: NextRequest) {
  try {
    // ✅ IMPORTANT: create client INSIDE handler (no build-time crash)
    const supabaseAdmin = getSupabaseAdmin();

    const body = await req.json();
    const batchId = body?.batchId;
    const threshold =
      typeof body?.threshold === "number" ? body.threshold : 0.82;

    if (!batchId) {
      return NextResponse.json({ error: "batchId required" }, { status: 400 });
    }

    // staging rows (unmatched only)
    const { data: stagingRows, error: stagingError } = await (supabaseAdmin as any)
      .from("agent_import_staging")
      .select("id, raw_name, raw_email")
      .eq("batch_id", batchId)
      .is("matched_agent_id", null);

    if (stagingError) {
      console.error(stagingError);
      return NextResponse.json(
        { error: "Failed to load staging rows" },
        { status: 500 }
      );
    }

    if (!stagingRows || stagingRows.length === 0) {
      return NextResponse.json({ matched: 0, total: 0 });
    }

    const { data: agents, error: agentsError } = await (supabaseAdmin as any)
      .from("agents")
      .select("id, name, email");

    if (agentsError) {
      console.error(agentsError);
      return NextResponse.json(
        { error: "Failed to load agents" },
        { status: 500 }
      );
    }

    if (!agents || agents.length === 0) {
      return NextResponse.json({ matched: 0, total: stagingRows.length });
    }

    type MatchUpdate = {
      id: string;
      matched_agent_id: string;
      match_score: number;
      match_method: string;
      status: string;
    };

    const updates: MatchUpdate[] = [];

    for (const row of stagingRows as any[]) {
      const rowName = row?.raw_name || "";
      if (!rowName) continue;

      let bestScore = 0;
      let bestAgentId: string | null = null;

      for (const agent of agents as any[]) {
        const score = similarity(rowName, agent?.name || "");
        if (score > bestScore) {
          bestScore = score;
          bestAgentId = agent?.id || null;
        }
      }

      if (bestAgentId && bestScore >= threshold) {
        updates.push({
          id: row.id,
          matched_agent_id: bestAgentId,
          match_score: Number(bestScore.toFixed(3)),
          match_method: "levenshtein+normalize",
          status: "suggested",
        });
      }
    }

    if (updates.length > 0) {
      const { error: updateError } = await (supabaseAdmin as any)
        .from("agent_import_staging")
        .upsert(updates, { onConflict: "id" });

      if (updateError) {
        console.error(updateError);
        return NextResponse.json(
          { error: "Failed to apply matches" },
          { status: 500 }
        );
      }
    }

    // audit log (insert ARRAY to avoid typing overload issues)
    const auditRow = {
      tenant_id: null,
      user_id: null,
      batch_id: batchId,
      action: "auto_match",
      meta: {
        matched: updates.length,
        total: stagingRows.length,
        threshold,
      },
    };

    const { error: auditError } = await (supabaseAdmin as any)
      .from("agent_import_audit_log")
      .insert([auditRow]);

    if (auditError) {
      console.error("audit insert error:", auditError);
      // audit fail ho to bhi main response success rehne do
    }

    return NextResponse.json({
      matched: updates.length,
      total: stagingRows.length,
      threshold,
    });
  } catch (e: any) {
    console.error("auto-match route error:", e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
