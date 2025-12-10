// src/app/api/migration/apply-mapping/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();

  const body = await req.json();
  const { jobId, mapping } = body as {
    jobId: string;
    mapping: Record<string, string | null>;
  };

  if (!jobId || !mapping) {
    return NextResponse.json(
      { error: "Missing jobId or mapping" },
      { status: 400 },
    );
  }

  const { data: rows, error } = await supabase
    .from("migration_staging")
    .select("id, raw_data")
    .eq("job_id", jobId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const r of rows || []) {
    const raw = (r as any).raw_data || {};
    const getVal = (field: string) => {
      const col = mapping[field];
      if (!col) return null;
      return raw[col] ?? null;
    };

    const amountVal = Number(getVal("amount") ?? 0);
    const paidVal = Number(getVal("paid") ?? 0);

    const updatePayload: any = {
      customer_name: getVal("customer_name"),
      supplier_name: getVal("supplier_name"),
      booking_ref: getVal("booking_ref"),
      amount: amountVal,
      paid: paidVal,
      balance: amountVal - paidVal,
      currency: getVal("currency"),
    };

    await supabase
      .from("migration_staging")
      .update(updatePayload)
      .eq("id", (r as any).id);
  }

  return NextResponse.json({ message: "Mapping applied" });
}
