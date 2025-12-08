import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    // TODO: yahan apni actual discount logic lagao
    // e.g. order ko db se fetch karo, discount apply karo, update karo

    return NextResponse.json(
      {
        ok: true,
        orderId: id,
        data: body,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("discount POST error", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
