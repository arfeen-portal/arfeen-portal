// proxy.ts  (ROOT of the project)
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// default function named `proxy`
export default function proxy(_req: NextRequest) {
  return NextResponse.next();
}

// routes jahan yeh chale
export const config = {
  matcher: ["/admin/:path*", "/transport/:path*", "/supplier/:path*"],
};
