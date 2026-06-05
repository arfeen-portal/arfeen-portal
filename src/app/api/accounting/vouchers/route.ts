import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type VoucherLineInput = {
  account_name?: string;
  description?: string;
  debit?: number | string;
  credit?: number | string;
  party_name?: string;
};

function toNumber(value: unknown): number {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("finance_vouchers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const voucherType = body.voucher_type || "journal";
    const voucherDate =
      body.voucher_date || new Date().toISOString().slice(0, 10);
    const description = body.description || "";
    const partyName = body.party_name || "";
    const currency = body.currency || "PKR";
    const exchangeRate = toNumber(body.exchange_rate || 1);

    const lines: VoucherLineInput[] = Array.isArray(body.lines)
      ? body.lines
      : [];

    const cleanLines = lines
      .map((line) => ({
        account_name: String(line.account_name || "").trim(),
        description: line.description || description,
        debit: toNumber(line.debit),
        credit: toNumber(line.credit),
        party_name: line.party_name || partyName,
      }))
      .filter((line) => line.account_name && (line.debit > 0 || line.credit > 0));

    if (cleanLines.length < 2) {
      return NextResponse.json(
        { success: false, error: "At least 2 valid voucher lines are required." },
        { status: 400 }
      );
    }

    const totalDebit = cleanLines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = cleanLines.reduce((sum, line) => sum + line.credit, 0);

    if (Number(totalDebit.toFixed(2)) !== Number(totalCredit.toFixed(2))) {
      return NextResponse.json(
        { success: false, error: "Debit and Credit must be equal." },
        { status: 400 }
      );
    }

    const voucherNo = `V-${Date.now().toString().slice(-6)}`;

    const { data: voucher, error: voucherError } = await supabase
      .from("finance_vouchers")
      .insert([
        {
          voucher_no: voucherNo,
          voucher_type: voucherType,
          voucher_date: voucherDate,
          description,
          party_name: partyName,
          currency,
          exchange_rate: exchangeRate,
          total_debit: totalDebit,
          total_credit: totalCredit,
          status: "posted",
        },
      ])
      .select("*")
      .single();

    if (voucherError || !voucher) {
      return NextResponse.json(
        {
          success: false,
          error: voucherError?.message || "Voucher insert failed.",
        },
        { status: 500 }
      );
    }

    const voucherLines = cleanLines.map((line, index) => ({
      voucher_id: voucher.id,
      line_no: index + 1,
      account_name: line.account_name,
      description: line.description,
      debit: line.debit,
      credit: line.credit,
      party_name: line.party_name,
    }));

    const { error: linesError } = await supabase
      .from("finance_voucher_lines")
      .insert(voucherLines);

    if (linesError) {
      await supabase.from("finance_vouchers").delete().eq("id", voucher.id);

      return NextResponse.json(
        { success: false, error: linesError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      voucher,
      lines: voucherLines,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected server error",
      },
      { status: 500 }
    );
  }
}