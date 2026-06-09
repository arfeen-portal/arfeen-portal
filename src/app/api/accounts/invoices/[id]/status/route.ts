import {
  getSupabaseAdmin,
  jsonError,
  jsonOk,
  parseString,
} from "@/lib/api/finance";
import { requireAccountant } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const ALLOWED = new Set(["draft", "sent", "partial", "paid", "overdue", "cancelled"]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const authUser = await requireAccountant();

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return jsonError("Supabase admin client is not configured.", 500);
    }

    const { id } = await context.params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const tenantId = authUser.tenantId;
    const status = parseString(body.status);

    if (!id) return jsonError("Invoice id is required.", 400);
    if (!status) return jsonError("status is required.", 400);
    if (!ALLOWED.has(status)) return jsonError("Invalid status.", 400);

    if (!tenantId) {
      return jsonError(
        authUser.role === "super_admin" || authUser.role === "admin"
          ? "tenant_id is missing from your user profile. Select/create a tenant before updating invoice status."
          : "Tenant not assigned to this user.",
        403
      );
    }

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

    return jsonOk({
      invoice: data,
      tenant_id: tenantId,
      role: authUser.role,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
}