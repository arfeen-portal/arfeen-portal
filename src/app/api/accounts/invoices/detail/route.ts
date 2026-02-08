import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client not available" },
      { status: 500 }
    );
  }

  const searchParams = new URL(req.url).searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      subtotal,
      tax_amount,
      total_amount,
      currency,
      status,
      issued_at,
      due_at,
      paid_at,
      notes,
      customer_id,
      agent_id,
      customers:customer_id (
        full_name,
        email,
        phone,
        city,
        country
      ),
      agents:agent_id (
        name
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !invoice) {
    console.error(error);
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }

  const { data: items, error: itemsError } = await supabase
    .from("invoice_items")
    .select("id, line_no, description, qty, unit_price, amount")
    .eq("invoice_id", id)
    .order("line_no", { ascending: true });

  if (itemsError) {
    console.error(itemsError);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    invoice,
    items: items ?? [],
  });
}
