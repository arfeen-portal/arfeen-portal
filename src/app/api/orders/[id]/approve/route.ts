// example: src/app/api/orders/[id]/approve/route.ts
import { withBugCapture } from "@/lib/withBugCapture";
import { NextRequest, NextResponse } from "next/server";

async function approve(req: NextRequest, { params }: { params: { id: string } }) {
  // ...your logic here...
  return NextResponse.json({ ok: true });
}

export const POST = withBugCapture(approve, {
  route: "/api/orders/[id]/approve",
  source: "api",
});
