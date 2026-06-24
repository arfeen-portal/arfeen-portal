import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function num(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function totals(lines: any[]) {
  return lines.reduce(
    (acc, line) => {
      acc.debit += num(line.debit);
      acc.credit += num(line.credit);
      return acc;
    },
    { debit: 0, credit: 0 }
  );
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  try {
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

    const total = totals(cleanLines);
    if (Math.abs(Number((total.debit - total.credit).toFixed(2))) > 0.01) {
      return NextResponse.json(
        { error: "Debit and credit totals must be equal." },
        { status: 400 }
      );
    }

    const { data: entry, error: entryError } = await supabase
      .from("acc_journal_entries")
      .insert({
        entry_date: body.entry_date || new Date().toISOString().slice(0, 10),
        description: body.description || null,
        reference: body.reference_no || body.voucher_no || null,
        source_module: body.source || body.voucher_type || "journal",
      })
      .select("id")
      .single();

    if (entryError || !entry?.id) {
      return NextResponse.json(
        { error: entryError?.message || "Failed to create journal entry." },
        { status: 500 }
      );
    }

    const lineRows = cleanLines.map((line: any, index: number) => ({
      journal_entry_id: entry.id,
      line_no: index + 1,
      account_id: line.account_id,
      description: line.description,
      debit: line.debit,
      credit: line.credit,
      currency_code: "PKR",
      fx_rate: 1,
    }));

    const { error: linesError } = await supabase
      .from("acc_journal_entry_lines")
      .insert(lineRows);

    if (linesError) {
      await supabase.from("acc_journal_entries").delete().eq("id", entry.id);
      return NextResponse.json({ error: linesError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: entry.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected journal error." },
      { status: 500 }
    );
  }
}
