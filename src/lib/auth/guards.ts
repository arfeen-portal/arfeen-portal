import { redirect } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type AppRole = "admin" | "agent" | "driver" | "accountant";

export type AuthUser = {
  authUserId: string;
  profileId: string;
  tenantId: string | null;
  role: AppRole;
  email: string | null;
  name: string | null;
};

type UserProfileRow = {
  id: string;
  tenant_id: string | null;
  role: string | null;
  email: string | null;
  name: string | null;
};

function isAppRole(value: string | null | undefined): value is AppRole {
  return (
    value === "admin" ||
    value === "agent" ||
    value === "driver" ||
    value === "accountant"
  );
}

export async function getCurrentAuthUserRaw() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase server client is not configured");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

export async function getCurrentAuthUser(): Promise<AuthUser> {
  const authUser = await getCurrentAuthUserRaw();
  const supabaseAdmin = getSupabaseAdmin();

  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured");
  }

  const { data: profile, error } = await supabaseAdmin
    .from("users")
    .select("id, tenant_id, role, email, name")
    .eq("id", authUser.id)
    .maybeSingle<UserProfileRow>();

  if (error) {
    throw new Error(`Unable to load user profile: ${error.message}`);
  }

  if (!profile) {
    throw new Error("User profile not found");
  }

  if (!isAppRole(profile.role)) {
    throw new Error("User role not found or invalid");
  }

  return {
    authUserId: authUser.id,
    profileId: profile.id,
    tenantId: profile.tenant_id ?? null,
    role: profile.role,
    email: profile.email ?? authUser.email ?? null,
    name: profile.name ?? null,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  return await getCurrentAuthUser();
}

export async function requireRole(allowedRoles: AppRole[]): Promise<AuthUser> {
  const user = await getCurrentAuthUser();

  if (!allowedRoles.includes(user.role)) {
    redirect("/403");
  }

  return user;
}

export async function requirePageRole(
  allowedRoles: AppRole[]
): Promise<AuthUser> {
  return await requireRole(allowedRoles);
}

export async function requireAdmin(): Promise<AuthUser> {
  return await requireRole(["admin"]);
}

export async function requireAccountant(): Promise<AuthUser> {
  return await requireRole(["admin", "accountant"]);
}

export async function requireAgent(): Promise<AuthUser> {
  return await requireRole(["admin", "agent"]);
}

export async function requireDriver(): Promise<AuthUser> {
  return await requireRole(["admin", "driver"]);
}