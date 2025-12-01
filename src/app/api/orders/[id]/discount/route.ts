import { NextRequest, NextResponse } from "next/server";

// POST /api/orders/[id]/discount
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } } // ✅ yahan Promise nahi, simple object
) {
  const { id } = params;

  // body agar chahiye to:
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    // body optional hai, ignore
  }

  // TODO: yahan apna real discount logic lagao
  // e.g. Supabase se order nikaalna, discount apply karna, etc.

  return NextResponse.json(
    {
      ok: true,
      orderId: id,
      message: "Discount route working",
      payload: body,
    },
    { status: 200 }
  );
}

