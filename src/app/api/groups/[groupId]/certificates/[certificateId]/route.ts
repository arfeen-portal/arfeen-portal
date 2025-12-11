// src/app/api/groups/[groupId]/certificates/[certificateId]/route.ts

import { NextRequest, NextResponse } from "next/server";

// 👇 TypeScript ko exactly ye signature chahiye:
export async function GET(
  request: NextRequest,
  context: { params: { groupId: string; certificateId: string } }
) {
  const { groupId, certificateId } = context.params;

  // TODO: yahan baad me real DB se certificate nikalna hai.
  // Abhi ke liye ham sirf params wapas bhej dete hain
  // taake route type-safe ho jaye aur deploy ho sake.
  return NextResponse.json(
    {
      ok: true,
      groupId,
      certificateId,
      message: "Certificate API placeholder – implement later.",
    },
    { status: 200 }
  );
}
