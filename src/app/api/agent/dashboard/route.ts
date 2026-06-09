import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBearerToken(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.replace("Bearer ", "").trim();
}

async function getAgent(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const admin = getSupabaseAdminSafe();
  const token = getBearerToken(req);

  if (!url || !anon || !admin || !token) return null;

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user) return null;

  const { data: agent } = await admin
    .from("agents")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!agent) return null;

  return { admin, user, agent };
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await getAgent(req);

    if (!ctx) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { admin, agent } = ctx;

    const [bookings, invoices, ledgerRows] = await Promise.all([
      admin
        .from("transport_bookings")
        .select("id,status,total_price,created_at")
        .eq("agent_id", agent.id)
        .limit(500),
      admin
        .from("finance_vouchers")
        .select("id,total_amount,status,created_at")
        .eq("agent_id", agent.id)
        .limit(500),
      admin
        .from("v_ledger")
        .select("*")
        .eq("agent_id", agent.id)
        .limit(500),
    ]);

    const bookingRows = bookings.data || [];
    const invoiceRows = invoices.data || [];
    const ledger = ledgerRows.data || [];

    const totalSales = bookingRows.reduce(
      (sum: number, row: any) => sum + Number(row.total_price || 0),
      0
    );

    const totalInvoices = invoiceRows.reduce(
      (sum: number, row: any) => sum + Number(row.total_amount || 0),
      0
    );

    const ledgerDebit = ledger.reduce(
      (sum: number, row: any) => sum + Number(row.debit || 0),
      0
    );

    const ledgerCredit = ledger.reduce(
      (sum: number, row: any) => sum + Number(row.credit || 0),
      0
    );

    return NextResponse.json({
      ok: true,
      stats: {
        bookings: bookingRows.length,
        invoices: invoiceRows.length,
        totalSales,
        totalInvoices,
        ledgerDebit,
        ledgerCredit,
        balance: ledgerDebit - ledgerCredit,
      },
      recentBookings: bookingRows.slice(0, 8),
      recentInvoices: invoiceRows.slice(0, 8),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}