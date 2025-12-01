"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type UserRow = {
  id: string;
  email: string;
  role: string;
  is_suspended: boolean;
  last_login_at: string | null;
};

export default function AdminUsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("users")
      .select("id, email, role, is_suspended, last_login_at")
      .order("created_at", { ascending: false });
    setUsers((data as UserRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUser = async (id: string, updates: Partial<UserRow>) => {
    await supabase.from("users").update(updates).eq("id", id);
    fetchUsers();
  };

  if (loading) return <p className="p-6 text-sm">Loading users…</p>;

  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-4">Users & Roles</h1>
      <div className="border rounded-xl bg-white overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Email</th>
              <th className="text-left px-3 py-2">Role</th>
              <th className="text-left px-3 py-2">Last Login</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">
                  <select
                    className="border rounded px-2 py-1 text-xs"
                    value={u.role}
                    onChange={(e) =>
                      updateUser(u.id, { role: e.target.value })
                    }
                  >
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                    <option value="driver">Driver</option>
                    <option value="accountant">Accountant</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  {u.last_login_at
                    ? new Date(u.last_login_at).toLocaleString()
                    : "-"}
                </td>
                <td className="px-3 py-2">
                  {u.is_suspended ? (
                    <span className="text-red-600">Suspended</span>
                  ) : (
                    <span className="text-green-600">Active</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    className="text-xs underline"
                    onClick={() =>
                      updateUser(u.id, { is_suspended: !u.is_suspended })
                    }
                  >
                    {u.is_suspended ? "Unsuspend" : "Suspend"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
