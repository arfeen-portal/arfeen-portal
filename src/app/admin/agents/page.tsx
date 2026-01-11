"use client";

import { useEffect, useState, useMemo } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
const supabase = useMemo(() => getSupabaseClient(), []);

type Agent = {
  id: string;
  company_name: string;
  country: string;
  city: string;
  admin_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
};

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("agents")
      .select(
        "id, company_name, country, city, admin_name, email, phone, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Agents load karte waqt error: " + error.message);
    } else if (data) {
      setAgents(data as Agent[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const updateStatus = async (id: string, status: "pending" | "approved" | "blocked") => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("agents")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Status update error: " + error.message);
    } else {
      setAgents((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    }
    setUpdatingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">
          Agents Directory
        </h1>
        <p className="text-sm text-slate-500 mb-4">
          Yahan se aap naye registered agents ko{" "}
          <span className="font-semibold">approve</span> ya{" "}
          <span className="font-semibold">block</span> kar sakte hain.
        </p>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Total Agents: {agents.length}
            </span>
            <button
              className="text-xs px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50"
              onClick={fetchAgents}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Abhi koi agent registered nahi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 border-b">
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
                          {agent.company_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {agent.admin_name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(agent.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-slate-600">
                        <div>{agent.country}</div>
                        <div className="text-slate-400">{agent.city}</div>
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-slate-600">
                        <div>{agent.email}</div>
                        <div className="text-slate-400">{agent.phone}</div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <span
                          className={
                            "inline-flex px-2 py-1 rounded-full text-[10px] font-medium " +
                            (agent.status === "approved"
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
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] hover:bg-emerald-700 disabled:bg-slate-300"
                          >
                            Approve
                          </button>
                          <button
                            disabled={updatingId === agent.id}
                            onClick={() => updateStatus(agent.id, "pending")}
                            className="px-3 py-1 rounded-lg border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50 disabled:bg-slate-100"
                          >
                            Pending
                          </button>
                          <button
                            disabled={updatingId === agent.id}
                            onClick={() => updateStatus(agent.id, "blocked")}
                            className="px-3 py-1 rounded-lg bg-rose-600 text-white text-[11px] hover:bg-rose-700 disabled:bg-slate-300"
                          >
                            Block
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

        <p className="mt-3 text-[11px] text-slate-400">
          Note: Ye page sirf admin users ke liye accessible hona chahiye. RLS
          policies ke zariye non-admin users ka access band rakhein.
        </p>
      </div>
    </div>
  );
}
