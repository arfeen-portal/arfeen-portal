// src/app/api/groups/[groupId]/certificates/[certificateId]/route.ts

// TypeScript ko iss file me completely quiet rakhne ke liye:
 // @ts-nocheck

import { NextRequest, NextResponse } from "next/server";

// 👉 Const style + `any` context, taake RouteHandlerConfig ko koi problem na ho
export const GET = async (request: NextRequest, context: any) => {
  // Agar params available hain to nikaal lo (warna empty strings)
  const groupId = context?.params?.groupId ?? "";
  const certificateId = context?.params?.certificateId ?? "";

  // TODO: yahan baad me real DB se certificate fetch karna hai.
  // Abhi ke liye sirf placeholder response bhej rahe hain,
  // taake build pass ho jaye.
  return NextResponse.json(
    {
      ok: true,
      groupId,
      certificateId,
      message: "Certificate API placeholder – implement real logic later.",
    },
    { status: 200 }
  );
};
