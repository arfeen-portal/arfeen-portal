import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const { id } = await context.params;

  const { data: entry, error: entryError } = await supabase
    .from("acc_journal_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (entryError) {
    return NextResponse.json({ error: entryError.message }, { status: 500 });
  }

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const { data: lines, error: linesError } = await supabase
    .from("acc_journal_entry_lines")
    .select(`
      *,
      account:acc_accounts(id, code, name)
    `)
    .eq("journal_entry_id", id)
    .order("line_no", { ascending: true });

  if (linesError) {
    return NextResponse.json({ error: linesError.message }, { status: 500 });
  }

  return NextResponse.json({
    entry: {
      ...entry,
      entry_no: entry.entry_no || entry.reference || entry.id,
      reference_no: entry.reference || null,
      posting_date: entry.posting_date || entry.entry_date,
      status: entry.status || "posted",
    },
    lines: (lines || []).map((line: any) => ({
      ...line,
      line_description: line.line_description || line.description || null,
    })),
  });
}

function num(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const { id } = await context.params;
  const body = await req.json();
  const lines = Array.isArray(body.lines) ? body.lines : [];

  const cleanLines = lines
    .map((line: any) => ({
      account_id: String(line.account_id || "").trim(),
      description: String(line.line_description || line.description || body.description || "").trim(),
      debit: num(line.debit),
      credit: num(line.credit),
    }))
    .filter((line: any) => line.account_id && (line.debit > 0 || line.credit > 0));

  if (cleanLines.length < 2) {
    return NextResponse.json(
      { error: "At least two valid journal lines are required." },
      { status: 400 }
    );
  }

  const total = cleanLines.reduce(
    (acc: { debit: number; credit: number }, line: any) => {
      acc.debit += line.debit;
      acc.credit += line.credit;
      return acc;
    },
    { debit: 0, credit: 0 }
  );

  if (Math.abs(Number((total.debit - total.credit).toFixed(2))) > 0.01) {
    return NextResponse.json(
      { error: "Debit and credit totals must be equal." },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabase
    .from("acc_journal_entries")
    .update({
      entry_date: body.entry_date || new Date().toISOString().slice(0, 10),
      description: body.description || null,
      reference: body.reference_no || body.voucher_no || null,
      source_module: body.source || body.voucher_type || "journal",
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("acc_journal_entry_lines")
    .delete()
    .eq("journal_entry_id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const lineRows = cleanLines.map((line: any, index: number) => ({
    journal_entry_id: id,
    line_no: index + 1,
    account_id: line.account_id,
    description: line.description,
    debit: line.debit,
    credit: line.credit,
    currency_code: "PKR",
    fx_rate: 1,
  }));

  const { error: insertError } = await supabase
    .from("acc_journal_entry_lines")
    .insert(lineRows);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id });
}
