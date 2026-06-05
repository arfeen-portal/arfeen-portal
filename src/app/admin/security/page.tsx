"use client";

import { useEffect, useMemo, useState } from "react";

type RlsAuditRow = {
  schema_name: string;
  table_name: string;
  rls_enabled: boolean;
  rls_forced: boolean;
  policy_count: number;
};

type RlsPolicyRow = {
  schema_name: string;
  table_name: string;
  policy_name: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string | null;
  with_check: string | null;
};

type AuditLogRow = {
  id: number;
  created_at: string;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  target_table: string | null;
  request_path: string | null;
  request_method: string | null;
  status: string;
  message: string | null;
  metadata: Record<string, unknown>;
};

export default function AdminSecurityPage() {
  const [tables, setTables] = useState<RlsAuditRow[]>([]);
  const [policies, setPolicies] = useState<RlsPolicyRow[]>([]);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    try {
      const [rlsRes, logsRes] = await Promise.all([
        fetch("/api/admin/rls-audit", { cache: "no-store" }),
        fetch("/api/admin/audit-logs?page=1&pageSize=20", { cache: "no-store" }),
      ]);

      const rlsJson = await rlsRes.json();
      const logsJson = await logsRes.json();

      setTables(rlsJson.tables ?? []);
      setPolicies(rlsJson.policies ?? []);
      setLogs(logsJson.rows ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const summary = useMemo(() => {
    const totalTables = tables.length;
    const rlsEnabled = tables.filter((t) => t.rls_enabled).length;
    const noPolicies = tables.filter((t) => t.policy_count === 0).length;
    const missingRls = tables.filter((t) => !t.rls_enabled).length;

    return { totalTables, rlsEnabled, noPolicies, missingRls };
  }, [tables]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Security Center</h1>
        <p className="text-sm text-muted-foreground">
          Role guards, RLS coverage, policy inspection, and audit activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Public Tables" value={summary.totalTables} />
        <StatCard label="RLS Enabled" value={summary.rlsEnabled} />
        <StatCard label="Missing RLS" value={summary.missingRls} />
        <StatCard label="No Policies" value={summary.noPolicies} />
      </div>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">RLS Table Audit</h2>
          <button
            onClick={loadAll}
            className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-3 py-2">Table</th>
                <th className="px-3 py-2">RLS</th>
                <th className="px-3 py-2">Forced</th>
                <th className="px-3 py-2">Policies</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((row) => (
                <tr key={row.table_name} className="border-b">
                  <td className="px-3 py-2 font-medium">{row.table_name}</td>
                  <td className="px-3 py-2">
                    <Badge ok={row.rls_enabled} yes="Enabled" no="Disabled" />
                  </td>
                  <td className="px-3 py-2">
                    <Badge ok={row.rls_forced} yes="Yes" no="No" />
                  </td>
                  <td className="px-3 py-2">{row.policy_count}</td>
                </tr>
              ))}
              {!loading && tables.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                    No RLS audit data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Policy Details</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-3 py-2">Table</th>
                <th className="px-3 py-2">Policy</th>
                <th className="px-3 py-2">Command</th>
                <th className="px-3 py-2">Roles</th>
                <th className="px-3 py-2">Using</th>
                <th className="px-3 py-2">With Check</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((row) => (
                <tr key={`${row.table_name}-${row.policy_name}`} className="border-b align-top">
                  <td className="px-3 py-2 font-medium">{row.table_name}</td>
                  <td className="px-3 py-2">{row.policy_name}</td>
                  <td className="px-3 py-2 uppercase">{row.cmd}</td>
                  <td className="px-3 py-2">{Array.isArray(row.roles) ? row.roles.join(", ") : ""}</td>
                  <td className="px-3 py-2 whitespace-pre-wrap text-xs">{row.qual ?? "-"}</td>
                  <td className="px-3 py-2 whitespace-pre-wrap text-xs">{row.with_check ?? "-"}</td>
                </tr>
              ))}
              {!loading && policies.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                    No policy details found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Recent Audit Logs</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Entity</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Path</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="px-3 py-2">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{row.actor_email ?? "-"}</td>
                  <td className="px-3 py-2">{row.actor_role ?? "-"}</td>
                  <td className="px-3 py-2">{row.action}</td>
                  <td className="px-3 py-2">{row.entity_type}</td>
                  <td className="px-3 py-2">
                    <Badge ok={row.status === "success"} yes="Success" no="Failed" />
                  </td>
                  <td className="px-3 py-2">{row.request_path ?? "-"}</td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                    No audit logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Badge({
  ok,
  yes,
  no,
}: {
  ok: boolean;
  yes: string;
  no: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
        ok
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {ok ? yes : no}
    </span>
  );
}