import { NextResponse } from "next/server";
// // @ts-ignore
import * as XLSX from "xlsx";
import { createSupabaseServerClient } from "@/lib/supabaseServer";


export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets[firstSheetName], {
    defval: null,
  });

  if (!sheet.length) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  const { data: job, error: jobError } = await supabase
    .from("migration_jobs")
    .insert({
      file_name: file.name,
      total_rows: sheet.length,
      status: "pending",
    })
    .select("*")
    .single();

  if (jobError || !job) {
    return NextResponse.json(
      { error: jobError?.message || "Job create failed" },
      { status: 500 },
    );
  }

  const normalize = (key: string | null) =>
    (key || "").toString().toLowerCase().replace(/\s+/g, " ").trim();

  const stagedRows = sheet.map((row) => {
    const keys = Object.keys(row);

    const findKey = (needles: string[]) =>
      keys.find((k) =>
        needles.some((n) => normalize(k).includes(n)),
      ) || null;

    const customerKey = findKey(["customer", "client", "party"]);
    const supplierKey = findKey(["supplier", "vendor"]);
    const refKey = findKey(["ref", "booking", "invoice"]);
    const amountKey = findKey(["amount", "total", "debit", "credit"]);
    const paidKey = findKey(["paid", "received"]);
    const currencyKey = findKey(["currency", "curr", "ccy"]);

    const amount = amountKey ? Number((row as any)[amountKey] ?? 0) : 0;
    const paid = paidKey ? Number((row as any)[paidKey] ?? 0) : 0;

    return {
      job_id: job.id,
      customer_name: customerKey
        ? String((row as any)[customerKey] ?? "").trim()
        : null,
      supplier_name: supplierKey
        ? String((row as any)[supplierKey] ?? "").trim()
        : null,
      booking_ref: refKey ? String((row as any)[refKey] ?? "").trim() : null,
      amount,
      paid,
      balance: amount - paid,
      currency: currencyKey
        ? String((row as any)[currencyKey] ?? "").trim()
        : null,
      raw_data: row,
      status: "unmapped",
    };
  });

  const { error: stagingError } = await supabase
    .from("migration_staging")
    .insert(stagedRows);

  if (stagingError) {
    return NextResponse.json(
      { error: stagingError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "File uploaded & staging created",
    jobId: job.id,
    totalRows: sheet.length,
  });
}
