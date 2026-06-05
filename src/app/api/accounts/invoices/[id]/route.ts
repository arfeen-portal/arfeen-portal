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

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonError("Supabase admin client not configured", 500);

  const { id } = await context.params;
  const tenantId = getTenantIdFromRequest(req);

  if (!id) return jsonError("Invoice id is required", 400);
  if (!tenantId) return jsonError("tenant_id is required", 400);

  const { data: invoice, error: invError } = await supabase
    .from("finance_invoices")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (invError || !invoice) return jsonError("Invoice not found", 404);

  const { data: lines, error: lineError } = await supabase
    .from("finance_invoice_lines")
    .select("*")
    .eq("invoice_id", id)
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true });

  if (lineError) return jsonError(lineError.message, 500);

  return jsonOk({ invoice, lines: lines || [] });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonError("Supabase admin client not configured", 500);

  const { id } = await context.params;
  const body = await req.json();
  const tenantId = getTenantIdFromRequest(req, body);

  if (!id) return jsonError("Invoice id is required", 400);
  if (!tenantId) return jsonError("tenant_id is required", 400);

  const { data: existing, error: existingError } = await supabase
    .from("finance_invoices")
    .select("id,status")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (existingError || !existing) return jsonError("Invoice not found", 404);
  if (existing.status === "posted") {
    return jsonError("Cannot edit a posted invoice", 400);
  }

  const customerName = parseString(body.customer_name);
  if (!customerName) return jsonError("customer_name is required", 400);

  const lines = Array.isArray(body.lines) ? body.lines : [];

  const cleanedLines = lines
    .map((l: any, i: number) => {
      const qty = parseNumber(l.qty, 1);
      const unitPrice = parseNumber(l.unit_price, 0);

      return {
        tenant_id: tenantId,
        invoice_id: id,
        sort_order: i + 1,
        description: parseString(l.description),
        qty,
        unit_price: unitPrice,
        line_total: qty * unitPrice,
      };
    })
    .filter((l: any) => l.description && l.line_total > 0);

  if (!cleanedLines.length) {
    return jsonError("At least one valid invoice line is required", 400);
  }

  const totalAmount = cleanedLines.reduce(
    (sum: number, l: any) => sum + Number(l.line_total || 0),
    0
  );

  const { error: invErr } = await supabase
    .from("finance_invoices")
    .update({
      customer_name: customerName,
      status: parseString(body.status, "draft"),
      invoice_date: normalizeDate(body.invoice_date),
      due_date: normalizeDate(body.due_date),
      notes: parseString(body.notes),
      total_amount: totalAmount,
      balance_due: totalAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (invErr) return jsonError(invErr.message || "Update failed", 500);

  const { error: delErr } = await supabase
    .from("finance_invoice_lines")
    .delete()
    .eq("invoice_id", id)
    .eq("tenant_id", tenantId);

  if (delErr) return jsonError(delErr.message || "Failed to clear invoice lines", 500);

  const { error: lineErr } = await supabase
    .from("finance_invoice_lines")
    .insert(cleanedLines);

  if (lineErr) return jsonError(lineErr.message || "Lines update failed", 500);

  return jsonOk({
    message: "Invoice updated",
    invoice_id: id,
    total_amount: totalAmount,
    lines_count: cleanedLines.length,
  });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonError("Supabase admin client not configured", 500);

  const { id } = await context.params;
  const tenantId = getTenantIdFromRequest(req);

  if (!id) return jsonError("Invoice id is required", 400);
  if (!tenantId) return jsonError("tenant_id is required", 400);

  const { data: invoice, error: invoiceError } = await supabase
    .from("finance_invoices")
    .select("id,status")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single();

  if (invoiceError || !invoice) return jsonError("Invoice not found", 404);

  if (invoice.status === "posted") {
    return jsonError("Cannot delete posted invoice", 400);
  }

  const { error: lineErr } = await supabase
    .from("finance_invoice_lines")
    .delete()
    .eq("invoice_id", id)
    .eq("tenant_id", tenantId);

  if (lineErr) return jsonError(lineErr.message, 500);

  const { error: invErr } = await supabase
    .from("finance_invoices")
    .delete()
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (invErr) return jsonError(invErr.message, 500);

  return jsonOk({ deleted: true });
}