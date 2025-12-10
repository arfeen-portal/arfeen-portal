import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // simple valid handler
  return NextResponse.json({ ok: true, route: "/transport" });
}
