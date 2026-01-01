import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  const invoiceNumber = "INV-" + Date.now();

  const { data, error } = await supabase
    .from("invoices")
    .insert([
      {
        invoice_number: invoiceNumber,
        customer_id: body.customer_id,
        agent_id: body.agent_id,
        booking_id: body.booking_id,
        subtotal: body.subtotal,
        tax_amount: body.tax,
        total_amount: body.total,
        status: "unpaid"
      }
    ])
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });

  return NextResponse.json({ invoice: data });
}
