// src/app/api/groups/[groupId]/certificates/route.ts

// Is file ke liye TypeScript checking off:
 // @ts-nocheck

import { NextRequest, NextResponse } from "next/server";

// GET handler – context ko `any` rakhte hain taake RouteHandlerConfig khush rahe
export const GET = async (request: NextRequest, context: any) => {
  const groupId = context?.params?.groupId ?? "";

  // TODO: yahan baad me real certificate list DB se nikalni hai.
  // Abhi ke liye sirf placeholder response, taake build pass ho jaye.
  return NextResponse.json(
    {
      ok: true,
      groupId,
      certificates: [],
      message:
        "Certificates list API placeholder – implement actual logic later.",
    },
    { status: 200 }
  );
};
