import { NextRequest, NextResponse } from "next/server";

export function withBugCapture(
  handler: (req: NextRequest) => Promise<Response> | Response,
  source: "api" | "server" | "edge" = "api"
) {
  return async (req: NextRequest) => {
    try {
      const res = await handler(req);
      return res;
    } catch (err: any) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/bug-report`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            severity: "error",
            source,
            route: req.nextUrl.pathname,
            message: err?.message ?? String(err),
            stack: err?.stack,
            meta: { hint: "withBugCapture" },
          }),
        });
      } catch {}
      // still respond 500
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  };
}
