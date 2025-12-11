import { NextRequest, NextResponse } from "next/server";
// yahan apne imports jo already the, woh rakhna:
// import { createAdminClient } from "@/lib/supabase/admin";
// import { generateInvoicePdf } from "@/lib/pdf/invoices";
// etc...

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 🔑 naya style: params ko await karo
  const { id } = await params;

  // 👇 yahan se neeche apna purana logic paste karo
  /*
  try {
    const supabase = createAdminClient();

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

    const pdfBuffer = await generateInvoicePdf(invoice);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=invoice-${id}.pdf`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
  */
}
