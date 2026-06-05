import { createClient, SupabaseClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

function getEnv(name: string): string | null {
  const value = process.env[name];
  if (!value || !value.trim()) return null;
  return value.trim();
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRole) return null;

  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function jsonOk(data: JsonRecord, status = 200) {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonError(message: string, status = 400, extra?: JsonRecord) {
  return new Response(
    JSON.stringify({
      ok: false,
      error: message,
      ...(extra || {}),
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

export function parseString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

export function normalizeDate(value: unknown, fallback?: string): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return fallback ?? null;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback ?? null;

  return d.toISOString().slice(0, 10);
}

export function getTenantIdFromRequest(
  req: Request,
  body?: Record<string, unknown>
): string | null {
  const url = new URL(req.url);
  const queryTenantId = url.searchParams.get("tenant_id");
  const headerTenantId = req.headers.get("x-tenant-id");
  const bodyTenantId =
    typeof body?.tenant_id === "string" ? body.tenant_id.trim() : null;

  return queryTenantId || headerTenantId || bodyTenantId || null;
}

export function groupBy<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}