import { getSupabaseAdmin, getTenantIdFromRequest, jsonError, jsonOk, parseString } from "@/lib/api/finance";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const ALLOWED = new Set(["draft", "sent", "partial", "paid", "overdue", "cancelled"]);

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return jsonError("Supabase admin client is not configured.", 500);
  }

  const { id } = await context.params;
  const body = (await req.json()) as Record<string, unknown>;
  const tenantId = getTenantIdFromRequest(req, body);
  const status = parseString(body.status);

  if (!tenantId) return jsonError("tenant_id is required.", 400);
  if (!status) return jsonError("status is required.", 400);
  if (!ALLOWED.has(status)) return jsonError("Invalid status.", 400);

  const { data, error } = await supabase
    .from("finance_invoices")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return jsonError("Failed to update invoice status.", 500, {
      details: error?.message,
    });
  }

  return jsonOk({ invoice: data });
}