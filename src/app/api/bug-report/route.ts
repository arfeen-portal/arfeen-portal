import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // ignore – body might be empty
  }

  const payload = {
    severity: (body?.severity ?? "error") as "error" | "warn" | "info",
    source: (body?.source ?? "client") as "client" | "server" | "api" | "edge",
    route: body?.route ?? req.nextUrl.pathname,
    message: typeof body?.message === "string" ? body.message : "unknown error",
    stack: typeof body?.stack === "string" ? body.stack : null,
    meta: typeof body?.meta === "object" ? body.meta : null,
    created_at: new Date().toISOString(),
  };

  // optional: write to supabase if you have a service key
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key =
      process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (url && key) {
      const supabase = createClient(url, key);
      await supabase.from("bug_reports").insert(payload);
    }
  } catch {
    // ignoring DB errors – we still return ok
  }

  // always console log on the server (helps while developing)
  console.error("[bug-report]", payload);

  return NextResponse.json({ ok: true });
}

// helpful for CORS/preflight if ever called cross origin
export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
