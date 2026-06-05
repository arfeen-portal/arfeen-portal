import {
  getSupabaseAdmin,
  getTenantIdFromRequest,
  jsonError,
  jsonOk,
  normalizeDate,
  parseNumber,
  parseString,
} from "@/lib/api/finance";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type InvoiceBodyLine = {
  description?: string;
  qty?: number | string;
  unit_price?: number | string;
  amount?: number | string;
};

type InvoiceBody = {
  tenant_id?: string;
  agent_id?: string | null;
  customer_name?: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  invoice_no?: string;
  invoice_date?: string;
  due_date?: string | null;
  currency?: string;
  status?: string;
  notes?: string | null;
  lines?: InvoiceBodyLine[];
};

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenant_id");
  const status = url.searchParams.get("status");
  const q = (url.searchParams.get("q") || "").trim();
  const from = normalizeDate(url.searchParams.get("from"));
  const to = normalizeDate(url.searchParams.get("to"));
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);

  if (!tenantId) {
    return jsonError("tenant_id is required.", 400);
  }

  let query = supabase
    .from("finance_invoices")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("invoice_date", { ascending: false })
    .limit(limit);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (from) query = query.gte("invoice_date", from);
  if (to) query = query.lte("invoice_date", to);

  if (q) {
    query = query.or(
      `invoice_no.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return jsonError("Failed to load invoices.", 500, { details: error.message });
  }

  return jsonOk({
    invoices: data || [],
  });
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const body = (await req.json()) as InvoiceBody;
  const tenantId = getTenantIdFromRequest(req, body);

  if (!tenantId) {
    return jsonError("tenant_id is required.", 400);
  }

  const customerName = parseString(body.customer_name);
  const invoiceNo = parseString(body.invoice_no);
  const invoiceDate = normalizeDate(body.invoice_date, new Date().toISOString().slice(0, 10));
  const dueDate = normalizeDate(body.due_date);
  const currency = parseString(body.currency, "PKR");
  const status = parseString(body.status, "draft");
  const notes = parseString(body.notes, "");
  const customerEmail = parseString(body.customer_email, "");
  const customerPhone = parseString(body.customer_phone, "");
  const agentId = parseString(body.agent_id, "");

  if (!customerName) return jsonError("customer_name is required.", 400);
  if (!invoiceNo) return jsonError("invoice_no is required.", 400);

  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (!lines.length) {
    return jsonError("At least one invoice line is required.", 400);
  }

  const cleanedLines = lines.map((line, index) => {
    const description = parseString(line.description);
    const qty = parseNumber(line.qty, 0);
    const unitPrice = parseNumber(line.unit_price, 0);
    const amount =
      line.amount !== undefined && line.amount !== null
        ? parseNumber(line.amount, 0)
        : qty * unitPrice;

    if (!description) {
      throw new Error(`Line ${index + 1}: description is required.`);
    }
    if (qty <= 0) {
      throw new Error(`Line ${index + 1}: qty must be greater than 0.`);
    }

    return {
      description,
      qty,
      unit_price: unitPrice,
      amount,
      line_total: amount,
    };
  });

  const subtotal = cleanedLines.reduce((sum, line) => sum + Number(line.amount || 0), 0);
  const taxAmount = 0;
  const totalAmount = subtotal + taxAmount;

  const { data: existing, error: existingError } = await supabase
    .from("finance_invoices")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("invoice_no", invoiceNo)
    .maybeSingle();

  if (existingError) {
    return jsonError("Failed to validate invoice number.", 500, {
      details: existingError.message,
    });
  }

  if (existing?.id) {
    return jsonError("Invoice number already exists for this tenant.", 409);
  }

  const { data: invoiceRows, error: invoiceError } = await supabase
    .from("finance_invoices")
    .insert([
      {
        tenant_id: tenantId,
        agent_id: agentId || null,
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        invoice_no: invoiceNo,
        invoice_date: invoiceDate,
        due_date: dueDate,
        currency,
        status,
        notes: notes || null,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        balance_due: totalAmount,
      },
    ])
    .select("*")
    .single();

  if (invoiceError || !invoiceRows) {
    return jsonError("Failed to create invoice.", 500, {
      details: invoiceError?.message,
    });
  }

  const linePayload = cleanedLines.map((line, index) => ({
    tenant_id: tenantId,
    invoice_id: invoiceRows.id,
    sort_order: index + 1,
    description: line.description,
    qty: line.qty,
    unit_price: line.unit_price,
    amount: line.amount,
    line_total: line.line_total,
  }));

  const { error: lineError } = await supabase
    .from("finance_invoice_lines")
    .insert(linePayload);

  if (lineError) {
    await supabase.from("finance_invoices").delete().eq("id", invoiceRows.id);
    return jsonError("Invoice created, but lines failed. Rolled back invoice.", 500, {
      details: lineError.message,
    });
  }

  return jsonOk(
    {
      invoice: invoiceRows,
      lines: linePayload,
    },
    201
  );
}