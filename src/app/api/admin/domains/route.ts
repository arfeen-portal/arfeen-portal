import { jsonFail, jsonOk, getAdminClientOrFail } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getAdminClientOrFail();
  if (!supabase) return jsonFail("Supabase admin client missing", 500);

  const { data, error } = await supabase
    .from("portal_domain_mappings")
    .select("*, portal_themes(*)")
    .order("created_at", { ascending: false });

  if (error) return jsonFail(error.message, 500);
  return jsonOk({ domains: data || [] });
}

export async function POST(req: Request) {
  const supabase = getAdminClientOrFail();
  if (!supabase) return jsonFail("Supabase admin client missing", 500);

  const body = await req.json();

  if (!body.domain) return jsonFail("Domain required");

  const { data, error } = await supabase
    .from("portal_domain_mappings")
    .upsert(
      [{
        tenant_id: body.tenant_id || null,
        domain: String(body.domain).replace(/^www\./, "").toLowerCase(),
        theme_id: body.theme_id || null,
        status: body.status || "active",
        auto_detect: body.auto_detect ?? true,
      }],
      { onConflict: "domain" }
    )
    .select()
    .single();

  if (error) return jsonFail(error.message, 500);
  return jsonOk({ domain: data });
}