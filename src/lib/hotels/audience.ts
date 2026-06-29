export const HOTEL_OPS_ROLES = new Set(["super_admin", "admin", "operations"]);

export function getHotelRequestsHref(
  role: string | null | undefined,
  isAuthenticated: boolean
): string {
  if (!isAuthenticated) {
    return "/login?next=/hotels/offline-demands";
  }

  if (role && HOTEL_OPS_ROLES.has(role)) {
    return "/admin/hotels/offline-demands";
  }

  if (role === "agent") {
    return "/agent/hotels";
  }

  return "/hotels/offline-demands";
}

export function getPostSubmitHotelHref(
  role: string | null | undefined,
  isAuthenticated: boolean
): string {
  if (!isAuthenticated) {
    return "/login?next=/hotels/offline-demands";
  }

  if (role && HOTEL_OPS_ROLES.has(role)) {
    return "/admin/hotels/offline-demands";
  }

  if (role === "agent") {
    return "/agent/hotels";
  }

  return "/login?next=/hotels/offline-demands";
}
