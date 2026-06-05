import { jsonFail, jsonOk, getAdminClientOrFail } from "@/lib/adminApi";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getAdminClientOrFail();
  if (!supabase) return jsonFail("Supabase admin client missing", 500);

  const [rolesRes, permissionsRes, matrixRes] = await Promise.all([
    supabase.from("portal_roles").select("*").order("role_key"),
    supabase.from("portal_permissions").select("*").order("module"),
    supabase.from("portal_role_permissions").select("*"),
  ]);

  if (rolesRes.error) return jsonFail(rolesRes.error.message, 500);
  if (permissionsRes.error) return jsonFail(permissionsRes.error.message, 500);
  if (matrixRes.error) return jsonFail(matrixRes.error.message, 500);

  return jsonOk({
    roles: rolesRes.data || [],
    permissions: permissionsRes.data || [],
    matrix: matrixRes.data || [],
  });
}

export async function POST(req: Request) {
  const supabase = getAdminClientOrFail();
  if (!supabase) return jsonFail("Supabase admin client missing", 500);

  const body = await req.json();
  const { role_id, permission_id, allowed } = body;

  if (!role_id || !permission_id) return jsonFail("role_id and permission_id required");

  const { data, error } = await supabase
    .from("portal_role_permissions")
    .upsert([{ role_id, permission_id, allowed: Boolean(allowed) }], {
      onConflict: "role_id,permission_id",
    })
    .select()
    .single();

  if (error) return jsonFail(error.message, 500);

  return jsonOk({ item: data });
}