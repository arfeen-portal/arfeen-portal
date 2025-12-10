// src/app/api/migration/auto-match/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { jobId } = await req.json();

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  const { data: rows, error } = await supabase
    .from("migration_staging")
    .select("*")
    .eq("job_id", jobId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const row of rows || []) {
    let mappedCustomerId: string | null = null;
    let mappedSupplierId: string | null = null;

    if (row.customer_name) {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .ilike("name", row.customer_name as string)
        .maybeSingle();

      if (customer) mappedCustomerId = customer.id;
    }

    if (row.supplier_name) {
      const { data: supplier } = await supabase
        .from("suppliers")
        .select("id")
        .ilike("name", row.supplier_name as string)
        .maybeSingle();

      if (supplier) mappedSupplierId = supplier.id;
    }

    const status =
      mappedCustomerId || mappedSupplierId ? "matched" : "needs_review";

    await supabase
      .from("migration_staging")
      .update({
        mapped_customer_id: mappedCustomerId,
        mapped_supplier_id: mappedSupplierId,
        status,
      })
      .eq("id", row.id);
  }

  return NextResponse.json({ message: "Auto matching completed" });
}
