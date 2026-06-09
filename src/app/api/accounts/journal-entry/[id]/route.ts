import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type JournalLineInput = {
  account_id: string;
  line_description?: string;
  debit?: number;
  credit?: number;
  entity_type?: string;
  entity_id?: string;
  cost_center?: string;
  branch?: string;
};

type JournalPayload = {
  entry_date: string;
  posting_date?: string;
  description?: string;
  reference_no?: string;
  status?: "draft" | "posted" | "cancelled";
  source?: "journal" | "voucher_payment" | "voucher_receipt" | "voucher_cash" | "voucher_bank";
  voucher_type?: "payment" | "receipt" | "cash" | "bank" | null;
  voucher_no?: string | null;
  party_name?: string | null;
  payment_method?: string | null;
  cheque_no?: string | null;
  cheque_date?: string | null;
  bank_name?: string | null;
  bank_reference?: string | null;
  lines: JournalLineInput[];
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function computeTotals(lines: JournalLineInput[]) {
  const total_debit = round2(
    lines.reduce((sum, line) => sum + Number(line.debit || 0), 0)
  );
  const total_credit = round2(
    lines.reduce((sum, line) => sum + Number(line.credit || 0), 0)
  );

  return { total_debit, total_credit };
}

function validatePayload(payload: JournalPayload) {
  if (!payload.entry_date) {
    throw new Error("Entry date is required");
  }

  if (!Array.isArray(payload.lines) || payload.lines.length < 2) {
    throw new Error("At least two journal lines are required");
  }

  for (const line of payload.lines) {
    if (!line.account_id) throw new Error("Each line must have an account");

    const debit = Number(line.debit || 0);
    const credit = Number(line.credit || 0);

    if ((debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
      throw new Error("Each line must have either debit or credit");
    }
  }

  const { total_debit, total_credit } = computeTotals(payload.lines);
  if (total_debit !== total_credit) {
    throw new Error("Debit and credit totals must be equal");
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await context.params;

    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("id", id)
      .single();

    if (entryError || !entry) {
      return NextResponse.json(
        { error: entryError?.message || "Entry not found" },
        { status: 404 }
      );
    }

    const { data: lines, error: linesError } = await supabase
      .from("journal_entry_lines")
      .select(`
        *,
        account:chart_of_accounts(id, code, name, account_type)
      `)
      .eq("journal_entry_id", id)
      .order("line_no", { ascending: true });

    if (linesError) {
      return NextResponse.json({ error: linesError.message }, { status: 500 });
    }

    return NextResponse.json({
      entry,
      lines: lines ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseAdmin();
    const { id } = await context.params;
    const payload = (await request.json()) as JournalPayload;

    validatePayload(payload);
    const { total_debit, total_credit } = computeTotals(payload.lines);

    const { error: updateError } = await supabase
      .from("journal_entries")
      .update({
        entry_date: payload.entry_date,
        posting_date: payload.posting_date || payload.entry_date,
        description: payload.description || null,
        reference_no: payload.reference_no || null,
        status: payload.status || "posted",
        source: payload.source || "journal",
        voucher_type: payload.voucher_type ?? null,
        voucher_no: payload.voucher_no || null,
        party_name: payload.party_name || null,
        payment_method: payload.payment_method || null,
        cheque_no: payload.cheque_no || null,
        cheque_date: payload.cheque_date || null,
        bank_name: payload.bank_name || null,
        bank_reference: payload.bank_reference || null,
        total_debit,
        total_credit,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { error: deleteError } = await supabase
      .from("journal_entry_lines")
      .delete()
      .eq("journal_entry_id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    const lineRows = payload.lines.map((line, index) => ({
      journal_entry_id: id,
      line_no: index + 1,
      account_id: line.account_id,
      line_description: line.line_description || null,
      debit: Number(line.debit || 0),
      credit: Number(line.credit || 0),
      entity_type: line.entity_type || null,
      entity_id: line.entity_id || null,
      cost_center: line.cost_center || null,
      branch: line.branch || null,
    }));

    const { error: insertLinesError } = await supabase
      .from("journal_entry_lines")
      .insert(lineRows);

    if (insertLinesError) {
      return NextResponse.json({ error: insertLinesError.message }, { status: 500 });
    }

    const { error: validateError } = await supabase.rpc(
      "validate_journal_entry_balance",
      { p_journal_entry_id: id }
    );

    if (validateError) {
      return NextResponse.json({ error: validateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}