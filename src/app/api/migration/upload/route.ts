import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SheetRow = Record<string, unknown>;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/\s+/g, "").replace(/_/g, "").trim();
}

function getCell(row: SheetRow, key: string | null): unknown {
  if (!key) return null;
  return row[key] ?? null;
}

function getString(row: SheetRow, key: string | null): string | null {
  const value = getCell(row, key);
  if (value === null || value === undefined) return null;

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function getNumber(row: SheetRow, key: string | null): number {
  const value = getCell(row, key);
  if (value === null || value === undefined || value === "") return 0;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not available" },
        { status: 500 }
      );
    }

    const formData = await (req as any).formData();
    const uploaded = formData.get("file");

    if (!uploaded || typeof uploaded.arrayBuffer !== "function") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName =
      typeof uploaded.name === "string" && uploaded.name.trim()
        ? uploaded.name
        : "upload.xlsx";

    const arrayBuffer = await uploaded.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
      return NextResponse.json({ error: "No sheet found" }, { status: 400 });
    }

    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet) {
      return NextResponse.json({ error: "Sheet not found" }, { status: 400 });
    }

    const sheet = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    }) as SheetRow[];

    if (sheet.length === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    const { data: job, error: jobError } = await supabase
      .from("migration_jobs")
      .insert({
        file_name: fileName,
        total_rows: sheet.length,
        status: "pending",
      })
      .select("*")
      .single();

    if (jobError || !job) {
      const message =
        jobError && "message" in jobError
          ? String(jobError.message)
          : "Job create failed";

      return NextResponse.json({ error: message }, { status: 500 });
    }

    const keys = Object.keys(sheet[0] ?? {});

    const findKey = (needles: string[]): string | null => {
      return (
        keys.find((key) => {
          const normalized = normalizeKey(key);
          return needles.some((needle) => normalized.includes(needle));
        }) ?? null
      );
    };

    const customerKey = findKey(["customer", "client", "party"]);
    const supplierKey = findKey(["supplier", "vendor"]);
    const refKey = findKey(["ref", "booking", "invoice"]);
    const amountKey = findKey(["amount", "total", "debit", "credit"]);
    const paidKey = findKey(["paid", "received"]);
    const currencyKey = findKey(["currency", "curr", "ccy"]);

    const stagedRows = sheet.map((row: SheetRow) => {
      const amount = getNumber(row, amountKey);
      const paid = getNumber(row, paidKey);

      return {
        job_id: job.id,
        customer_name: getString(row, customerKey) ?? "",
        supplier_name: getString(row, supplierKey),
        booking_ref: getString(row, refKey),
        amount,
        paid,
        balance: amount - paid,
        currency: getString(row, currencyKey),
        raw_data: row,
        status: "unmapped",
      };
    });

    const { error: stagingError } = await supabase
      .from("migration_staging")
      .insert(stagedRows);

    if (stagingError) {
      const message =
        "message" in stagingError
          ? String(stagingError.message)
          : "Failed to create staging rows";

      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.json({
      message: "File uploaded & staging created",
      jobId: job.id,
      totalRows: sheet.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}