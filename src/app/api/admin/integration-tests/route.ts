import { jsonFail, jsonOk, getAdminClientOrFail } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getAdminClientOrFail();
  if (!supabase) return jsonFail("Supabase admin client missing", 500);

  const { data, error } = await supabase
    .from("integration_api_tests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return jsonFail(error.message, 500);
  return jsonOk({ tests: data || [] });
}

export async function POST(req: Request) {
  const supabase = getAdminClientOrFail();
  if (!supabase) return jsonFail("Supabase admin client missing", 500);

  const body = await req.json();

  const started = Date.now();
  let status = 0;
  let responseBody: any = null;
  let lastError: string | null = null;

  try {
    const headers = body.headers || {};
    const response = await fetch(body.endpoint, {
      method: body.method || "GET",
      headers,
      body:
        body.method && body.method !== "GET"
          ? JSON.stringify(body.body || {})
          : undefined,
      cache: "no-store",
    });

    status = response.status;

    const text = await response.text();
    try {
      responseBody = JSON.parse(text);
    } catch {
      responseBody = { raw: text.slice(0, 4000) };
    }
  } catch (err: any) {
    lastError = err?.message || "Request failed";
  }

  const latency = Date.now() - started;

  const payload = {
    tenant_id: body.tenant_id || null,
    name: body.name || "Untitled Test",
    provider: body.provider || "Custom",
    method: body.method || "GET",
    endpoint: body.endpoint,
    headers: body.headers || {},
    body: body.body || {},
    last_status: status || null,
    last_latency_ms: latency,
    last_response: responseBody || {},
    last_error: lastError,
    tested_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("integration_api_tests")
    .insert([payload])
    .select()
    .single();

  if (error) return jsonFail(error.message, 500);

  return jsonOk({ test: data });
}