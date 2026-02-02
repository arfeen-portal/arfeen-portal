import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  // ✅ Supabase sirf runtime par
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client not available" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      total_amount,
      currency,
      status,
      issued_at,
      customer_id,
      agent_id,
      customers:customer_id ( full_name ),
      agents:agent_id ( name )
    `)
    .order("issued_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }

  return NextResponse.json({ items: data ?? [] });
}
