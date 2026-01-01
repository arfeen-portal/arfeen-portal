import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ ok: true, message: "Transport GET working" });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  return NextResponse.json({
    ok: true,
    message: "Transport POST working",
    data: body,
  });
}
