import { NextResponse } from "next/server";
import { AppRole, hasRequiredRole } from "@/lib/auth/roles";
import { getRequestUser } from "@/lib/auth/getRequestUser";

export type RequireRoleResult =
  | { ok: true; user: { id: string; email: string | null; role: string | null } }
  | { ok: false; response: NextResponse };

export async function requireRole(allowedRoles: AppRole[]): Promise<RequireRoleResult> {
  const user = await getRequestUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (!hasRequiredRole(user.role, allowedRoles)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden", requiredRoles: allowedRoles, currentRole: user.role },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user };
}