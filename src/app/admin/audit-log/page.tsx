import { createClient } from "@/lib/supabaseServer";

type AuditRow = {
  id: number;
  table_name: string;
  row_pk: string;
  action: string;
  changed_at: string;
  changed_by: string | null;
  old_data: any;
  new_data: any;
};

export default async function AuditLogPage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .order("changed_at", { ascending: false })
    .limit(100);

  if (error) {
    return <p className="text-red-500">Failed to load audit log</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Audit Log</h1>

      {(data as AuditRow[]).map((row) => (
        <div key={row.id} className="border p-3 rounded">
          <div className="font-semibold">
            {row.table_name} — {row.action}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(row.changed_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
