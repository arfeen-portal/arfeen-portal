"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";

type Agent = {
  id: string;
  company_name: string | null;
  name: string | null;
  country: string | null;
  city: string | null;
  admin_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  status: string;
  created_at: string;
};

type StatusFilter = "all" | "pending" | "approved" | "blocked";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [error, setError] = useState("");

  const fetchAgents = async (status?: string) => {
    setLoading(true);
    setError("");

    const query = status && status !== "all" ? `?status=${status}` : "";
    const res = await fetch(`/api/admin/agents${query}`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json?.ok) {
      setError(json?.error || "Failed to load agents.");
      setAgents([]);
    } else {
      setAgents(json.agents as Agent[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAgents(filter === "all" ? undefined : filter);
  }, [filter]);

  const pendingCount = useMemo(
    () => agents.filter((agent) => agent.status === "pending").length,
    [agents]
  );

  const updateStatus = async (
    id: string,
    status: "pending" | "approved" | "blocked"
  ) => {
    setUpdatingId(id);
    setError("");

    const res = await fetch("/api/admin/agents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok || !json?.ok) {
      setError(json?.error || "Status update failed.");
    } else {
      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === id ? { ...agent, status: json.agent.status } : agent
        )
      );
    }

    setUpdatingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-2xl font-semibold text-slate-800">
          Agent Approvals
        </h1>
        <p className="mb-4 text-sm text-slate-500">
          Review B2B registrations, approve agents for login, or reject by
          blocking the account.
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["pending", "approved", "blocked", "all"] as StatusFilter[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition ${
                  filter === item
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item}
                {item === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}
              </button>
            )
          )}

          <button
            type="button"
            className="ml-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50"
            onClick={() => fetchAgents(filter === "all" ? undefined : filter)}
          >
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-xs text-slate-500">
              Showing {agents.length} agent{agents.length === 1 ? "" : "s"}
            </span>
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No agents found for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Company / Admin
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Country / City
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Contact
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Company Details
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">
                      Status
                    </th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="border-b last:border-0 hover:bg-slate-50/70"
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="font-semibold text-slate-800">
                          {agent.company_name || agent.name || "—"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {agent.admin_name || "—"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(agent.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-slate-600">
                        <div>{agent.country || "—"}</div>
                        <div className="text-slate-400">{agent.city || "—"}</div>
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-slate-600">
                        <div>{agent.email || "—"}</div>
                        <div className="text-slate-400">{agent.phone || "—"}</div>
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-slate-600">
                        <div>{agent.address || "—"}</div>
                        <div className="text-slate-400">{agent.website || "—"}</div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span
                          className={
                            "inline-flex rounded-full px-2 py-1 text-[10px] font-medium " +
                            (agent.status === "approved" || agent.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : agent.status === "blocked"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700")
                          }
                        >
                          {agent.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        <div className="inline-flex gap-2">
                          <button
                            disabled={updatingId === agent.id}
                            onClick={() => updateStatus(agent.id, "approved")}
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] text-white hover:bg-emerald-700 disabled:bg-slate-300"
                          >
                            Approve
                          </button>
                          <button
                            disabled={updatingId === agent.id}
                            onClick={() => updateStatus(agent.id, "blocked")}
                            className="rounded-lg bg-rose-600 px-3 py-1 text-[11px] text-white hover:bg-rose-700 disabled:bg-slate-300"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
