import { getSupabaseAdmin, jsonError, jsonOk, normalizeDate } from "@/lib/api/finance";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type InvoiceRow = {
  id: string;
  tenant_id: string;
  agent_id: string | null;
  invoice_no: string | null;
  invoice_date: string | null;
  due_date: string | null;
  customer_name: string | null;
  status: string | null;
  total_amount: number | null;
  balance_due: number | null;
};

type VoucherRow = {
  id: string;
  tenant_id: string;
  voucher_no: string | null;
  voucher_date: string | null;
  reference_type: string | null;
  reference_id: string | null;
  remarks: string | null;
  total_amount: number | null;
  voucher_type: string | null;
};

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenant_id");
  const agentId = url.searchParams.get("agent_id");
  const from = normalizeDate(url.searchParams.get("from"), "2000-01-01");
  const to = normalizeDate(url.searchParams.get("to"), new Date().toISOString().slice(0, 10));

  if (!tenantId) return jsonError("tenant_id is required.", 400);
  if (!agentId) return jsonError("agent_id is required.", 400);

  const { data: invoices, error: invoiceError } = await supabase
    .from("finance_invoices")
    .select("id, tenant_id, agent_id, invoice_no, invoice_date, due_date, customer_name, status, total_amount, balance_due")
    .eq("tenant_id", tenantId)
    .eq("agent_id", agentId)
    .gte("invoice_date", from!)
    .lte("invoice_date", to!)
    .order("invoice_date", { ascending: true });

  if (invoiceError) {
    return jsonError("Failed to load agent invoices.", 500, {
      details: invoiceError.message,
    });
  }

  const { data: vouchers, error: voucherError } = await supabase
    .from("finance_vouchers")
    .select("id, tenant_id, voucher_no, voucher_date, reference_type, reference_id, remarks, total_amount, voucher_type")
    .eq("tenant_id", tenantId)
    .eq("reference_type", "agent")
    .eq("reference_id", agentId)
    .gte("voucher_date", from!)
    .lte("voucher_date", to!)
    .order("voucher_date", { ascending: true });

  if (voucherError) {
    return jsonError("Failed to load agent settlements.", 500, {
      details: voucherError.message,
    });
  }

  const invoiceRows = (invoices || []) as InvoiceRow[];
  const voucherRows = (vouchers || []) as VoucherRow[];

  const ledger = [
    ...invoiceRows.map((row) => ({
      date: row.invoice_date,
      type: "invoice",
      ref_no: row.invoice_no,
      description: row.customer_name || "Agent Invoice",
      debit: Number(row.total_amount || 0),
      credit: 0,
      status: row.status,
      source_id: row.id,
    })),
    ...voucherRows.map((row) => ({
      date: row.voucher_date,
      type: row.voucher_type || "voucher",
      ref_no: row.voucher_no,
      description: row.remarks || "Settlement / Receipt",
      debit: 0,
      credit: Number(row.total_amount || 0),
      status: null,
      source_id: row.id,
    })),
  ].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return da - db;
  });

  let runningBalance = 0;

  const ledgerWithBalance = ledger.map((entry) => {
    runningBalance += Number(entry.debit || 0) - Number(entry.credit || 0);
    return {
      ...entry,
      running_balance: runningBalance,
    };
  });

  const totalDebit = ledger.reduce((sum, row) => sum + Number(row.debit || 0), 0);
  const totalCredit = ledger.reduce((sum, row) => sum + Number(row.credit || 0), 0);

  return jsonOk({
    filters: {
      tenant_id: tenantId,
      agent_id: agentId,
      from,
      to,
    },
    summary: {
      total_debit: totalDebit,
      total_credit: totalCredit,
      closing_balance: runningBalance,
    },
    entries: ledgerWithBalance,
  });
}