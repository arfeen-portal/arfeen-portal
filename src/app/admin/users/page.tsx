"use client";

import { useEffect, useMemo, useState } from "react";

type UserRole =
  | "super_admin"
  | "admin"
  | "accountant"
  | "operations"
  | "agent"
  | "staff"
  | "driver";

type UserRow = {
  id: string;
  email: string;
  role: UserRole;
  is_suspended: boolean | null;
  last_login_at: string | null;
  created_at?: string | null;
};

const roleOptions: { label: string; value: UserRole }[] = [
  { label: "Super Admin", value: "super_admin" },
  { label: "Admin", value: "admin" },
  { label: "Accountant", value: "accountant" },
  { label: "Operations", value: "operations" },
  { label: "Agent", value: "agent" },
  { label: "Staff", value: "staff" },
  { label: "Driver", value: "driver" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const totalUsers = users.length;
  const activeUsers = useMemo(
    () => users.filter((u) => !u.is_suspended).length,
    [users]
  );
  const suspendedUsers = totalUsers - activeUsers;

  async function fetchUsers() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to load users.");
      }

      setUsers((json.users || []) as UserRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(id: string, updates: Partial<UserRow>) {
    setSavingId(id);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to update user.");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...json.user } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user.");
    } finally {
      setSavingId("");
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
          <p className="text-sm font-semibold text-amber-300">
            Admin Security
          </p>
          <h1 className="mt-2 text-2xl font-black md:text-3xl">
            Users & Roles
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Manage internal users, agent access, role permissions and account
            suspension from one protected admin screen.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Users" value={totalUsers} />
          <StatCard label="Active Users" value={activeUsers} />
          <StatCard label="Suspended Users" value={suspendedUsers} danger />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                User Access Control
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Role changes affect protected routes immediately.
              </p>
            </div>

            <button
              onClick={fetchUsers}
              disabled={loading}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              Loading users…
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-sm text-slate-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Last Login</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {u.email}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          ID: {u.id}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <select
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-slate-900"
                          value={u.role}
                          disabled={savingId === u.id}
                          onChange={(e) =>
                            updateUser(u.id, {
                              role: e.target.value as UserRole,
                            })
                          }
                        >
                          {roleOptions.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleString()
                          : "-"}
                      </td>

                      <td className="px-4 py-3">
                        {u.is_suspended ? (
                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                            Suspended
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          disabled={savingId === u.id}
                          onClick={() =>
                            updateUser(u.id, {
                              is_suspended: !u.is_suspended,
                            })
                          }
                        >
                          {savingId === u.id
                            ? "Saving..."
                            : u.is_suspended
                              ? "Unsuspend"
                              : "Suspend"}
                        </button>
                      </td>
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

function StatCard({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={danger ? "mt-2 text-3xl font-black text-red-600" : "mt-2 text-3xl font-black text-slate-900"}>
        {value}
      </p>
    </div>
  );
}