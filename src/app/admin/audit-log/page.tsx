import { createServerSupabaseClient } from "@/utils/supabase/server";

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
  const supabase = createServerSupabaseClient();

  const { data: logs, error } = await supabase
    .from("audit_log")
    .select(
      "id, table_name, row_pk, action, changed_at, changed_by, old_data, new_data"
    )
    .order("changed_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Audit Log</h1>
      <p className="text-sm text-gray-500">
        Last 100 changes (INSERT / UPDATE / DELETE) across important tables.
      </p>

      {error && (
        <p className="text-sm text-red-500">
          Error loading audit log: {error.message}
        </p>
      )}

      {(!logs || logs.length === 0) && !error && (
        <p className="text-sm text-gray-500">No audit entries yet.</p>
      )}

      <div className="space-y-2">
        {logs?.map((log: AuditRow) => (
          <div
            key={log.id}
            className="border border-gray-200 rounded-lg p-3 text-xs bg-white"
          >
            <div className="flex justify-between mb-1">
              <div>
                <span className="font-semibold">{log.table_name}</span>{" "}
                <span className="text-gray-400">#{log.row_pk}</span>
              </div>
              <div className="text-gray-500">
                {new Date(log.changed_at).toLocaleString()}
              </div>
            </div>
            <div className="mb-1">
              <span className="uppercase font-semibold">{log.action}</span>{" "}
              <span className="text-gray-500">
                by {log.changed_by ?? "unknown"}
              </span>
            </div>
            <details className="mb-1">
              <summary className="cursor-pointer text-gray-600">
                Old Data
              </summary>
              <pre className="mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(log.old_data, null, 2)}
              </pre>
            </details>
            <details>
              <summary className="cursor-pointer text-gray-600">
                New Data
              </summary>
              <pre className="mt-1 bg-gray-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(log.new_data, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
