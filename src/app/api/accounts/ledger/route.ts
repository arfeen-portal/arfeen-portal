import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(v: string | null) {
  return v && v.trim() ? v.trim() : null;
}

function getRowDate(row: any) {
  return (
    row.entry_date ||
    row.voucher_date ||
    row.date ||
    row.transaction_date ||
    row.posting_date ||
    row.created_at ||
    ""
  );
}

export async function GET(req: Request) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);

  const accountId = clean(searchParams.get("accountId"));
  const dateFrom = clean(searchParams.get("dateFrom"));
  const dateTo = clean(searchParams.get("dateTo"));
  const search = clean(searchParams.get("search"))?.toLowerCase();

  let query = supabase.from("v_ledger").select("*").limit(accountId ? 5000 : 300);

  if (accountId) {
    query = query.eq("account_id", accountId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  let rows = data ?? [];

  rows = rows.filter((row: any) => {
    const rowDate = String(getRowDate(row)).slice(0, 10);

    const matchesDate =
      (!dateFrom || rowDate >= dateFrom) && (!dateTo || rowDate <= dateTo);

    const haystack = [
      row.description,
      row.narration,
      row.voucher_no,
      row.voucher_number,
      row.voucher_type,
      row.account_name,
      row.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !search || haystack.includes(search);

    return matchesDate && matchesSearch;
  });

  rows.sort((a: any, b: any) => {
    const da = String(getRowDate(a));
    const db = String(getRowDate(b));
    return da.localeCompare(db);
  });

  return NextResponse.json({
    success: true,
    data: rows,
  });
}