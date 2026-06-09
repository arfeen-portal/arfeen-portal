import { redirect } from "next/navigation";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export type AppRole =
  | "super_admin"
  | "admin"
  | "accountant"
  | "operations"
  | "agent"
  | "staff"
  | "driver";

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
    value === "super_admin" ||
    value === "admin" ||
    value === "accountant" ||
    value === "operations" ||
    value === "agent" ||
    value === "staff" ||
    value === "driver"
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
  const supabaseAdmin = getSupabaseAdminSafe();

  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured");
  }

  const authEmail = authUser.email?.toLowerCase() ?? null;

  if (!authEmail) {
    throw new Error("Authenticated user email not found");
  }

  const { data: profile, error } = await supabaseAdmin
    .from("users")
    .select("id, tenant_id, role, email, name")
    .eq("email", authEmail)
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
    redirect("/unauthorized");
  }

  return user;
}

export async function requirePageRole(
  allowedRoles: AppRole[]
): Promise<AuthUser> {
  return await requireRole(allowedRoles);
}

export async function requireSuperAdmin(): Promise<AuthUser> {
  return await requireRole(["super_admin"]);
}

export async function requireAdmin(): Promise<AuthUser> {
  return await requireRole(["super_admin", "admin"]);
}

export async function requireAccountant(): Promise<AuthUser> {
  return await requireRole(["super_admin", "admin", "accountant"]);
}

export async function requireOperations(): Promise<AuthUser> {
  return await requireRole(["super_admin", "admin", "operations"]);
}

export async function requireAgent(): Promise<AuthUser> {
  return await requireRole(["super_admin", "admin", "agent"]);
}

export async function requireDriver(): Promise<AuthUser> {
  return await requireRole(["super_admin", "admin", "driver"]);
}