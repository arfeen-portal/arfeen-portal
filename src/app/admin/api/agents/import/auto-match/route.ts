import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/* ---------------- helpers ---------------- */

function normalizeUrl(v?: string) {
  if (!v) return "";
  return v.trim().replace(/\/$/, "");
}

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
  const na = normalizeName(a);
  const nb = normalizeName(b);
  const maxLen = Math.max(na.length, nb.length);
  if (!maxLen) return 1;
  const dist = levenshtein(na, nb);
  return (maxLen - dist) / maxLen;
}

/* ---------------- route ---------------- */

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseAdminSafe;

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const batchId = body?.batchId;
    const threshold =
      typeof body?.threshold === "number" ? body.threshold : 0.82;

    if (!batchId) {
      return NextResponse.json(
        { error: "batchId required" },
        { status: 400 }
      );
    }

    // 1️⃣ Load staging rows (unmatched)
    const { data: stagingRows, error: stagingError } = await supabase
      .from("agent_import_staging")
      .select("id, raw_name, email")
      .eq("batch_id", batchId)
      .is("matched_agent_id", null);

    if (stagingError) {
      return NextResponse.json(
        { error: "Failed to load staging rows" },
        { status: 500 }
      );
    }

    if (!stagingRows || stagingRows.length === 0) {
      return NextResponse.json({ matched: 0, total: 0 });
    }

    // 2️⃣ Load agents
    const { data: agents, error: agentsError } = await supabase
      .from("agents")
      .select("id, name, email");

    if (agentsError) {
      return NextResponse.json(
        { error: "Failed to load agents" },
        { status: 500 }
      );
    }

    if (!agents || agents.length === 0) {
      return NextResponse.json({
        matched: 0,
        total: stagingRows.length,
      });
    }

    // 3️⃣ Match logic
    const updates: any[] = [];

    for (const row of stagingRows) {
      if (!row.raw_name) continue;

      let bestScore = 0;
      let bestAgentId: string | null = null;

      for (const agent of agents) {
        const score = similarity(row.raw_name, agent.name || "");
        if (score > bestScore) {
          bestScore = score;
          bestAgentId = agent.id;
        }
      }

      if (bestAgentId && bestScore >= threshold) {
        updates.push({
          id: row.id,
          matched_agent_id: bestAgentId,
          match_score: Number(bestScore.toFixed(3)),
          match_method: "levenshtein-normalize",
          status: "suggested",
        });
      }
    }

    // 4️⃣ Apply updates
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from("agent_import_staging")
        .upsert(updates, { onConflict: "id" });

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to apply matches" },
          { status: 500 }
        );
      }
    }

    // 5️⃣ Audit log (non-blocking)
    await supabase.from("agent_import_audit_log").insert({
      tenant_id: null,
      user_id: null,
      batch_id: batchId,
      action: "auto_match",
      meta: {
        matched: updates.length,
        total: stagingRows.length,
        threshold,
      },
    });

    return NextResponse.json({
      matched: updates.length,
      total: stagingRows.length,
      threshold,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
