import { ok, fail } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await requireAdmin();

    return ok(
      {
        allowed: true,
        role: user.role,
        tenant_id: user.tenantId ?? null,
      },
      "Admin access granted"
    );
  } catch (error) {
    return fail(error);
  }
}