import { ok, fail } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireAuth();

    return ok(user, "Current user fetched successfully");
  } catch (error) {
    return fail(error);
  }
}