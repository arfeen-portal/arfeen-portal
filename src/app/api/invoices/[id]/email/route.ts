import { NextRequest, NextResponse } from "next/server";
// apna admin client / helpers jaisa bhi pehle tha, yahan import rakho:
// import { createAdminClient } from "@/lib/supabase/admin";
// import { sendInvoiceEmail } from "@/lib/email/invoices";
// etc...
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ⬅️ naya tareeqa: params ko await karo
  const { id } = await params;

  // ⬇️ YAHAN se neeche apna purana logic daal do
  // (jo pehle POST function ke andar tha, sirf `id` lene ka tareeqa change hua hai)

  /*
  try {
    const supabase = createAdminClient();

    // invoice load karo
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !invoice) {
      console.error(error);
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // email bhejo
    await sendInvoiceEmail(invoice);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to send invoice email" },
      { status: 500 }
    );
  }
  */
}
