import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

const PATCHABLE_FIELDS = new Set([
  "entry_date",
  "description",
  "debit",
  "credit",
  "amount",
  "debit_account",
  "credit_account",
  "reference_no",
  "narration",
  "status",
  "issue_notes",
]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function jsonOk(data: Record<string, unknown> = {}, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

function cleanString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function parseNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(String(value).replace(/,/g, "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function normalizeDate(value: unknown): string | null {
  const raw = cleanString(value);
  if (!raw) return null;

  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);

  const m = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!m) return null;

  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  let year = m[3];
  if (year.length === 2) year = `20${year}`;

  const parsed = new Date(`${year}-${month}-${day}`);
  if (Number.isNaN(parsed.getTime())) return null;

  return `${year}-${month}-${day}`;
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function getTenantId(req: NextRequest): string {
  const headerTenant = req.headers.get("x-tenant-id");

  if (headerTenant && isValidUuid(headerTenant)) {
    return headerTenant;
  }

  return DEFAULT_TENANT_ID;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current.trim());
  return result;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_").trim()
  );

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });

    return row;
  });
}

function pickField(row: Record<string, unknown>, keys: string[]) {
  const normalized: Record<string, unknown> = {};

  Object.entries(row).forEach(([key, value]) => {
    normalized[key.toLowerCase().replace(/\s+/g, "_").trim()] = value;
  });

  for (const key of keys) {
    const k = key.toLowerCase().replace(/\s+/g, "_").trim();
    if (normalized[k] !== undefined) return normalized[k];
  }

  return "";
}

function detectAccounts(description: string, debit: number, credit: number) {
  const text = description.toLowerCase();

  let debitAccount = "";
  let creditAccount = "";

  if (text.includes("cash")) {
    if (debit > 0) debitAccount = "Cash Account";
    if (credit > 0) creditAccount = "Cash Account";
  }

  if (text.includes("bank") || text.includes("transfer") || text.includes("ibft")) {
    if (debit > 0) debitAccount = "Bank Account";
    if (credit > 0) creditAccount = "Bank Account";
  }

  if (text.includes("agent") || text.includes("customer") || text.includes("client")) {
    if (debit > 0) debitAccount = "Agent Receivable";
    if (credit > 0) creditAccount = "Agent Receivable";
  }

  if (text.includes("supplier") || text.includes("hotel") || text.includes("airline")) {
    if (debit > 0) debitAccount = "Supplier Payable";
    if (credit > 0) creditAccount = "Supplier Payable";
  }

  if (!debitAccount && debit > 0) debitAccount = "Suspense Account";
  if (!creditAccount && credit > 0) creditAccount = "Suspense Account";

  return { debitAccount, creditAccount };
}

function buildImportRow(row: Record<string, unknown>, batchId: string, tenantId: string) {
  const entryDate = normalizeDate(
    pickField(row, ["date", "entry_date", "transaction_date", "voucher_date"])
  );

  const description = cleanString(
    pickField(row, ["description", "details", "particulars", "narration", "memo"])
  );

  const debit = parseNumber(pickField(row, ["debit", "dr", "debit_amount"]));
  const credit = parseNumber(pickField(row, ["credit", "cr", "credit_amount"]));
  const amount = debit || credit || parseNumber(pickField(row, ["amount", "value", "total"]));

  const referenceNo = cleanString(
    pickField(row, ["reference", "reference_no", "ref", "voucher_no", "transaction_id"])
  );

  const manualDebitAccount = cleanString(
    pickField(row, ["debit_account", "dr_account", "account_debit"])
  );

  const manualCreditAccount = cleanString(
    pickField(row, ["credit_account", "cr_account", "account_credit"])
  );

  const suggested = detectAccounts(description, debit, credit);

  const debitAccount = manualDebitAccount || suggested.debitAccount;
  const creditAccount = manualCreditAccount || suggested.creditAccount;

  const issues: string[] = [];

  if (!entryDate) issues.push("Missing or invalid date");
  if (!description) issues.push("Missing description");
  if (!amount && !debit && !credit) issues.push("Missing amount");
  if (debit > 0 && !debitAccount) issues.push("Missing debit account");
  if (credit > 0 && !creditAccount) issues.push("Missing credit account");
  if (debit > 0 && credit > 0) issues.push("Both debit and credit found");

  let confidence = 100 - issues.length * 18;
  if (debitAccount === "Suspense Account" || creditAccount === "Suspense Account") confidence -= 15;
  confidence = Math.max(10, Math.min(100, confidence));

  const duplicateKey = [
    entryDate || "no-date",
    description.toLowerCase().replace(/\s+/g, " ").slice(0, 80),
    debit || 0,
    credit || 0,
    amount || 0,
  ].join("|");

  return {
    tenant_id: tenantId,
    batch_id: batchId,
    entry_date: entryDate,
    description,
    debit,
    credit,
    amount,
    debit_account: debitAccount,
    credit_account: creditAccount,
    reference_no: referenceNo,
    narration: description,
    raw_data: row,
    status: issues.length ? "needs_review" : "ready",
    issue_notes: issues,
    confidence_score: confidence,
    duplicate_key: duplicateKey,
  };
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return jsonError("Supabase admin client not configured", 500);

  const tenantId = getTenantId(req);
  const { searchParams } = new URL(req.url);

  const batchId = searchParams.get("batch_id");
  const status = searchParams.get("status") || "all";
  const search = searchParams.get("search") || "";

  let rowsQuery = supabase
    .from("ledger_import_rows")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (batchId) rowsQuery = rowsQuery.eq("batch_id", batchId);
  if (status !== "all") rowsQuery = rowsQuery.eq("status", status);
  if (search) {
    rowsQuery = rowsQuery.or(
      `description.ilike.%${search}%,reference_no.ilike.%${search}%,debit_account.ilike.%${search}%,credit_account.ilike.%${search}%`
    );
  }

  const { data: rows, error: rowsError } = await rowsQuery;
  if (rowsError) return jsonError(rowsError.message, 500);

  const { data: batches, error: batchesError } = await supabase
    .from("ledger_import_batches")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (batchesError) return jsonError(batchesError.message, 500);

  const { data: accounts } = await supabase
    .from("acc_accounts")
    .select("id, code, name, type, is_active")
    .order("code", { ascending: true });

  return jsonOk({
    rows: rows || [],
    batches: batches || [],
    accounts: accounts || [],
    tenant_id: tenantId,
  });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return jsonError("Supabase admin client not configured", 500);

  const tenantId = getTenantId(req);

  try {
    const contentType = req.headers.get("content-type") || "";
    let parsedRows: Record<string, unknown>[] = [];
    let fileName = "manual-import.csv";

    if (contentType.includes("multipart/form-data")) {
      const formData: any = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file || typeof file === "string") {
        return jsonError("CSV file is required");
      }

      fileName = file.name;
      const text = await file.text();
      parsedRows = parseCsv(text);
    } else {
      const body = await req.json();
      fileName = cleanString(body.file_name) || fileName;
      parsedRows = Array.isArray(body.rows) ? body.rows : [];
    }

    if (!parsedRows.length) {
      return jsonError("No valid rows found. Upload CSV with Date, Description, Debit/Credit or Amount.");
    }

    const { data: batch, error: batchError } = await supabase
      .from("ledger_import_batches")
      .insert({
        tenant_id: tenantId,
        file_name: fileName,
        source: "ledger_import",
        status: "processing",
        total_rows: parsedRows.length,
      })
      .select("*")
      .single();

    if (batchError || !batch) {
      return jsonError(batchError?.message || "Failed to create import batch", 500);
    }

    const preparedRows = parsedRows.map((row) => buildImportRow(row, batch.id, tenantId));

    const duplicateMap = new Map<string, number>();
    preparedRows.forEach((row) => {
      duplicateMap.set(row.duplicate_key, (duplicateMap.get(row.duplicate_key) || 0) + 1);
    });

    const finalRows = preparedRows.map((row) => {
      const duplicate = (duplicateMap.get(row.duplicate_key) || 0) > 1;

      if (!duplicate) return row;

      return {
        ...row,
        status: "duplicate",
        issue_notes: [...row.issue_notes, "Possible duplicate row in uploaded file"],
      };
    });

    const { error: rowsError } = await supabase.from("ledger_import_rows").insert(finalRows);

    if (rowsError) {
      await supabase.from("ledger_import_batches").delete().eq("id", batch.id);
      return jsonError(rowsError.message, 500);
    }

    const readyRows = finalRows.filter((r) => r.status === "ready").length;
    const reviewRows = finalRows.filter((r) => r.status === "needs_review").length;
    const duplicateRows = finalRows.filter((r) => r.status === "duplicate").length;

    await supabase
      .from("ledger_import_batches")
      .update({
        status: reviewRows || duplicateRows ? "needs_review" : "ready",
        ready_rows: readyRows,
        review_rows: reviewRows,
        duplicate_rows: duplicateRows,
        updated_at: new Date().toISOString(),
      })
      .eq("id", batch.id);

    return jsonOk(
      {
        batch_id: batch.id,
        total_rows: finalRows.length,
        ready_rows: readyRows,
        review_rows: reviewRows,
        duplicate_rows: duplicateRows,
      },
      201
    );
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Ledger import failed", 500);
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return jsonError("Supabase admin client not configured", 500);

  const tenantId = getTenantId(req);

  try {
    const body = await req.json();
    const action = cleanString(body.action);

    if (action === "update_row") {
      const rowId = cleanString(body.row_id);
      const field = cleanString(body.field);
      const value = body.value;

      if (!rowId) return jsonError("row_id is required");
      if (!PATCHABLE_FIELDS.has(field)) return jsonError("This field cannot be updated");

      const payload: Record<string, unknown> = {
        [field]: value,
        updated_at: new Date().toISOString(),
      };

      if (["debit", "credit", "amount"].includes(field)) {
        payload[field] = parseNumber(value);
      }

      if (field === "entry_date") {
        payload[field] = normalizeDate(value);
      }

      const { error } = await supabase
        .from("ledger_import_rows")
        .update(payload)
        .eq("id", rowId)
        .eq("tenant_id", tenantId);

      if (error) return jsonError(error.message, 500);

      return jsonOk({ updated: true });
    }

    if (action === "mark_ready") {
      const rowIds: string[] = Array.isArray(body.row_ids) ? body.row_ids : [];
      if (!rowIds.length) return jsonError("row_ids are required");

      const { error } = await supabase
        .from("ledger_import_rows")
        .update({
          status: "ready",
          issue_notes: [],
          confidence_score: 100,
          updated_at: new Date().toISOString(),
        })
        .in("id", rowIds)
        .eq("tenant_id", tenantId);

      if (error) return jsonError(error.message, 500);

      return jsonOk({ updated: rowIds.length });
    }

    if (action === "approve_rows") {
      const rowIds: string[] = Array.isArray(body.row_ids) ? body.row_ids : [];
      if (!rowIds.length) return jsonError("row_ids are required");

      const { error } = await supabase
        .from("ledger_import_rows")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .in("id", rowIds)
        .eq("tenant_id", tenantId);

      if (error) return jsonError(error.message, 500);

      return jsonOk({ approved: rowIds.length });
    }

    if (action === "rollback_rows") {
      const rowIds: string[] = Array.isArray(body.row_ids) ? body.row_ids : [];
      if (!rowIds.length) return jsonError("row_ids are required");

      const { error } = await supabase
        .from("ledger_import_rows")
        .update({
          status: "rolled_back",
          updated_at: new Date().toISOString(),
        })
        .in("id", rowIds)
        .eq("tenant_id", tenantId);

      if (error) return jsonError(error.message, 500);

      return jsonOk({ rolled_back: rowIds.length });
    }

    if (action === "delete_batch") {
      const batchId = cleanString(body.batch_id);
      if (!batchId) return jsonError("batch_id is required");

      const { error: rowError } = await supabase
        .from("ledger_import_rows")
        .delete()
        .eq("batch_id", batchId)
        .eq("tenant_id", tenantId);

      if (rowError) return jsonError(rowError.message, 500);

      const { error: batchError } = await supabase
        .from("ledger_import_batches")
        .delete()
        .eq("id", batchId)
        .eq("tenant_id", tenantId);

      if (batchError) return jsonError(batchError.message, 500);

      return jsonOk({ deleted: true });
    }

    return jsonError("Invalid action");
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Ledger import update failed", 500);
  }
}