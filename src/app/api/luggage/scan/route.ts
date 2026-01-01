import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // TODO: yahan tumhara original scan logic (DB lookup / QR decode) hona chahiye.
    // For now, return a valid response so build passes.
    return NextResponse.json({ ok: true, received: body }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Invalid request" },
      { status: 400 }
    );
  }
}

// (Optional) health check
export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}
