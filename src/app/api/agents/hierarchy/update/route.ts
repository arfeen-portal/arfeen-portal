import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { withAgent } from "@/app/api/agent/_utils/withAgent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(req: Request) {
  try {
    const ctx = await withAgent(req);
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "SUPABASE_NOT_AVAILABLE" },
        { status: 503 }
      );
    }

    const body = await req.json();

    const agentId = body.agent_id ?? body.agentId ?? body.id;
    const parentAgentId =
      body.parent_agent_id ?? body.parentAgentId ?? body.parent_id ?? null;
    const level = body.level ?? null;

    if (!agentId) {
      return NextResponse.json(
        { ok: false, error: "AGENT_ID_REQUIRED" },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {
      parent_agent_id: parentAgentId,
      updated_at: new Date().toISOString(),
    };

    if (level !== null && level !== undefined && level !== "") {
      updatePayload.level = Number(level);
    }

    const { data, error } = await supabase
      .from("agents")
      .update(updatePayload)
      .eq("id", agentId)
      .eq("tenant_id", ctx.tenant_id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: "AGENT_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Agent hierarchy updated successfully.",
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "FAILED_TO_UPDATE_AGENT_HIERARCHY",
      },
      { status: 401 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const ctx = await withAgent(req);
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "SUPABASE_NOT_AVAILABLE", data: [] },
        { status: 503 }
      );
    }

    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("tenant_id", ctx.tenant_id)
      .order("level", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, data: [] },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: data ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "FAILED_TO_LOAD_AGENT_HIERARCHY",
        data: [],
      },
      { status: 401 }
    );
  }
}