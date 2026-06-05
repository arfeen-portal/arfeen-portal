export type AppRole = "admin" | "agent" | "driver" | "accountant";

export const APP_ROLES: AppRole[] = ["admin", "agent", "driver", "accountant"];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

export function hasRequiredRole(
  currentRole: string | null | undefined,
  allowedRoles: AppRole[]
): boolean {
  if (!currentRole) return false;
  return allowedRoles.includes(currentRole as AppRole);
}