export async function getPortalBranding() {
  try {
    const res = await fetch("/api/portal/bootstrap", {
      method: "GET",
      cache: "no-store",
    });

    const json = await res.json();
    return json.branding ?? null;
  } catch {
    return null;
  }
}