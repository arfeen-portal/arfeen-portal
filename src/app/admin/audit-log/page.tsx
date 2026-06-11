import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AuditRow = {
  id: number;
  table_name: string;
  row_pk: string;
  action: string;
  changed_at: string;
  changed_by: string | null;
  old_data: unknown;
  new_data: unknown;
};

export default async function AuditLogPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <div className="p-6 text-red-500">
        Supabase server client not configured.
      </div>
    );
  }

  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Failed to load audit log: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold">Audit Log</h1>

      {(data as AuditRow[] | null)?.map((row) => (
        <div key={row.id} className="rounded border bg-white p-3">
          <div className="font-semibold">
            {row.table_name} - {row.action}
          </div>

          <div className="text-sm text-gray-500">
            {new Date(row.changed_at).toLocaleString()}
          </div>
        </div>
      ))}

      {(!data || data.length === 0) && (
        <p className="text-sm text-gray-500">No audit logs found.</p>
      )}
    </div>
  );
}