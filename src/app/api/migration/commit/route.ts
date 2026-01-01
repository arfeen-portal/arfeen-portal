// src/app/api/migration/commit/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
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

  const matched = (rows || []).filter((r) => r.status === "matched");

  for (const r of matched) {
    await supabase.from("ledger").insert({
      customer_id: r.mapped_customer_id,
      supplier_id: r.mapped_supplier_id,
      amount: r.amount,
      paid_amount: r.paid,
      balance: r.balance,
      reference: r.booking_ref,
      currency: r.currency,
    });
  }

  await supabase
    .from("migration_jobs")
    .update({
      status: "completed",
      processed_rows: matched.length,
      completed_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  return NextResponse.json({
    message: "Migration completed",
    imported: matched.length,
    total: rows?.length || 0,
  });
}
