import { ok, fail } from "@/lib/api/response";
import { requireAccountant } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user = await requireAccountant();

    return ok({
      allowed: true,
      role: user.role,
      tenant_id: user.tenantId ?? null
    }, "Account access granted");
  } catch (error) {
    return fail(error);
  }
}