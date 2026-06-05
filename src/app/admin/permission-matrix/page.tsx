"use client";

import { useEffect, useMemo, useState } from "react";

type Role = { id: string; role_key: string; role_name: string };
type Permission = { id: string; permission_key: string; module: string; action: string; description?: string };
type Matrix = { id: string; role_id: string; permission_id: string; allowed: boolean };

export default function PermissionMatrixPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [matrix, setMatrix] = useState<Matrix[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/permission-matrix", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) {
      setRoles(json.roles || []);
      setPermissions(json.permissions || []);
      setMatrix(json.matrix || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const allowedMap = useMemo(() => {
    const map = new Map<string, boolean>();
    matrix.forEach((m) => map.set(`${m.role_id}:${m.permission_id}`, m.allowed));
    return map;
  }, [matrix]);

  async function toggle(role_id: string, permission_id: string, current: boolean) {
    await fetch("/api/admin/permission-matrix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_id, permission_id, allowed: !current }),
    });
    await load();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 to-blue-950 p-8 text-white shadow-xl">
          <p className="text-sm text-blue-200">Security Control Center</p>
          <h1 className="mt-2 text-3xl font-bold">Role-based Permission Matrix</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Har role ke permissions ko module/action level par control karein. Ye SaaS white-label tenants ke liye centralized access governance hai.
          </p>
        </section>

        <section className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Permission Grid</h2>
            <button onClick={load} className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading matrix...</div>
          ) : (
            <div className="overflow-auto rounded-2xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-100 px-4 py-3 text-left">Permission</th>
                    {roles.map((r) => (
                      <th key={r.id} className="px-4 py-3 text-center">{r.role_name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-slate-50">
                      <td className="sticky left-0 bg-white px-4 py-3">
                        <div className="font-semibold text-slate-900">{p.permission_key}</div>
                        <div className="text-xs text-slate-500">{p.module} / {p.action}</div>
                      </td>
                      {roles.map((r) => {
                        const current = allowedMap.get(`${r.id}:${p.id}`) || false;
                        return (
                          <td key={r.id} className="px-4 py-3 text-center">
                            <button
                              onClick={() => toggle(r.id, p.id, current)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                current ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                              }`}
                            >
                              {current ? "Allowed" : "Blocked"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}