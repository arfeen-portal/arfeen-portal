// src/app/api/orders/[id]/discount/route.ts

import { NextRequest, NextResponse } from "next/server";

type DiscountRequestBody = {
  discountCode?: string;
  amount?: number;
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    // body optional hai – tum baad me apna logic add kar sakte ho
    const body = (await req.json().catch(() => null)) as
      | DiscountRequestBody
      | null;

    // TODO: yahan apna real discount apply logic lagao (DB, Supabase, etc.)
    // abhi ke liye sirf success response bhej raha hoon.

    return NextResponse.json(
      {
        ok: true,
        message: "Discount endpoint reached successfully.",
        orderId,
        data: body,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("ERROR in /api/orders/[id]/discount:", error);

    return NextResponse.json(
      {
        ok: false,
        message: "Failed to apply discount.",
      },
      { status: 500 }
    );
  }
}
