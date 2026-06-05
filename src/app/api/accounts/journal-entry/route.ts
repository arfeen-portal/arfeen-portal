import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function num(v: unknown) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("acc_accounts")
    .select("id, code, name")
    .order("code", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ accounts: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    const body = await req.json();
    const header = body?.header || {};
    const lines = Array.isArray(body?.lines) ? body.lines : [];

    const cleanLines = lines
      .map((l: any) => ({
        account_id: String(l.account_id || "").trim(),
        desc: String(l.desc || "").trim(),
        debit: num(l.debit),
        credit: num(l.credit),
      }))
      .filter((l: any) => l.account_id && (l.debit > 0 || l.credit > 0));

    if (cleanLines.length < 2) {
      return NextResponse.json(
        { error: "Minimum two valid journal lines required." },
        { status: 400 }
      );
    }

    for (const line of cleanLines) {
      if (line.debit > 0 && line.credit > 0) {
        return NextResponse.json(
          { error: "One line cannot contain both debit and credit." },
          { status: 400 }
        );
      }
    }

    const totalDebit = cleanLines.reduce((a: number, l: any) => a + l.debit, 0);
    const totalCredit = cleanLines.reduce((a: number, l: any) => a + l.credit, 0);
    const difference = Number((totalDebit - totalCredit).toFixed(2));

    if (Math.abs(difference) > 0.01) {
      return NextResponse.json(
        { error: "Journal entry is not balanced.", totalDebit, totalCredit, difference },
        { status: 400 }
      );
    }

    const { data: entry, error: entryError } = await supabase
      .from("journal_entries")
      .insert({
        date: header.date,
        desc: header.desc || "",
        ref: header.ref || "",
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: "posted",
      })
      .select("id")
      .single();

    if (entryError || !entry?.id) {
      return NextResponse.json(
        { error: entryError?.message || "Failed to create journal entry." },
        { status: 500 }
      );
    }

    const lineItems = cleanLines.map((l: any, i: number) => ({
      journal_entry_id: entry.id,
      line_no: i + 1,
      account_id: l.account_id,
      desc: l.desc,
      debit: l.debit,
      credit: l.credit,
    }));

    const { error: linesError } = await supabase
      .from("journal_entry_lines")
      .insert(lineItems);

    if (linesError) {
      await supabase.from("journal_entries").delete().eq("id", entry.id);

      return NextResponse.json(
        { error: linesError.message, rollback: true },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: entry.id });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unexpected journal error." },
      { status: 500 }
    );
  }
}