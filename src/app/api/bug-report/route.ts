import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  let body: any = {};

  try {
    body = await req.json();
  } catch {
    // body optional
  }

  const payload = {
    severity: (body?.severity ?? "error") as "error" | "warn" | "info",
    source: (body?.source ?? "client") as
      | "client"
      | "server"
      | "api"
      | "edge",
    route: body?.route ?? req.nextUrl.pathname,
    message: typeof body?.message === "string" ? body.message : "unknown error",
    stack: typeof body?.stack === "string" ? body.stack : null,
    meta: typeof body?.meta === "object" ? body.meta : null,
    created_at: new Date().toISOString(),
  };

  const supabase = createSupabaseServerClient();

  if (supabase) {
    try {
      await supabase.from("bug_reports").insert(payload);
    } catch {
      // ignore db failure
    }
  }

  console.error("[bug-report]", payload);

  return NextResponse.json({ ok: true });
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
