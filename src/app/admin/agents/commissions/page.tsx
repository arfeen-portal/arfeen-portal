"use client";

import { useEffect, useMemo, useState } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Rule = {
  id: string;
  tenant_id: string;
  agent_id: string;
  rule_name: string;
  applies_to: string;
  commission_mode: string;
  commission_value: number;
  is_active: boolean;
  notes: string | null;
  agent?: { id: string; name: string; agent_code: string | null };
};

type Entry = {
  id: string;
  agent_id: string;
  booking_type: string;
  booking_id: string | null;
  gross_amount: number;
  commission_pct: number;
  commission_amount: number;
  status: string;
  created_at: string;
  agent?: { id: string; name: string; agent_code: string | null };
};

type SummaryRow = {
  agent_id: string;
  tenant_id: string;
  agent_name: string;
  agent_code: string | null;
  total_entries: number;
  gross_sales: number;
  total_commission: number;
  paid_commission: number;
  pending_commission: number;
};

type Agent = {
  id: string;
  tenant_id: string;
  name: string;
  agent_code: string | null;
};

function money(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function AgentCommissionsPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    tenant_id: "",
    agent_id: "",
    rule_name: "Default Rule",
    applies_to: "transport",
    commission_mode: "percent",
    commission_value: "0",
    is_active: true,
    notes: "",
  });

  async function loadAgents() {
    const res = await fetch("/api/agents/dashboard", { cache: "no-store" });
    const json = await res.json();
    const rows = (json?.rows || []) as Array<{
      agent_id: string;
      tenant_id: string;
      agent_name: string;
      agent_code: string | null;
    }>;

    const mapped = rows.map((r) => ({
      id: r.agent_id,
      tenant_id: r.tenant_id,
      name: r.agent_name,
      agent_code: r.agent_code,
    }));
    setAgents(mapped);

    if (!form.agent_id && mapped[0]) {
      setForm((prev) => ({
        ...prev,
        agent_id: mapped[0].id,
        tenant_id: mapped[0].tenant_id,
      }));
    }
  }

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch("/api/agents/commissions", { cache: "no-store" });
      const json = await res.json();
      setRules(json?.rules || []);
      setEntries(json?.entries || []);
      setSummary(json?.summary || []);
      await loadAgents();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => {
    return {
      totalCommission: summary.reduce((sum, row) => sum + Number(row.total_commission || 0), 0),
      pendingCommission: summary.reduce((sum, row) => sum + Number(row.pending_commission || 0), 0),
      paidCommission: summary.reduce((sum, row) => sum + Number(row.paid_commission || 0), 0),
    };
  }, [summary]);

  async function saveRule() {
    const selectedAgent = agents.find((a) => a.id === form.agent_id);

    const res = await fetch("/api/agents/commissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_rule",
        tenant_id: selectedAgent?.tenant_id || form.tenant_id,
        agent_id: form.agent_id,
        rule_name: form.rule_name,
        applies_to: form.applies_to,
        commission_mode: form.commission_mode,
        commission_value: Number(form.commission_value || 0),
        is_active: form.is_active,
        notes: form.notes,
      }),
    });

    const json = await res.json();
    if (!json.ok) {
      alert(json.error || "Failed to save rule");
      return;
    }

    await loadData();
    alert("Commission rule saved successfully");
  }

  async function approveEntry(id: string) {
    const res = await fetch("/api/agents/commissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", id }),
    });
    const json = await res.json();
    if (!json.ok) {
      alert(json.error || "Failed to approve entry");
      return;
    }
    await loadData();
  }

  async function markPaid(id: string) {
    const res = await fetch("/api/agents/commissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_paid", id }),
    });
    const json = await res.json();
    if (!json.ok) {
      alert(json.error || "Failed to mark paid");
      return;
    }
    await loadData();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-600">Agents</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Commission Automation
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Auto commission rules, live commission ledger and approval workflow.
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading commissions...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Total Commission" value={`PKR ${money(totals.totalCommission)}`} />
            <Card title="Pending Commission" value={`PKR ${money(totals.pendingCommission)}`} />
            <Card title="Paid Commission" value={`PKR ${money(totals.paidCommission)}`} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Commission Rule</h2>
              <div className="mt-5 space-y-4">
                <Field label="Agent">
                  <select
                    value={form.agent_id}
                    onChange={(e) => {
                      const selected = agents.find((a) => a.id === e.target.value);
                      setForm((prev) => ({
                        ...prev,
                        agent_id: e.target.value,
                        tenant_id: selected?.tenant_id || "",
                      }));
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  >
                    <option value="">Select agent</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} {agent.agent_code ? `(${agent.agent_code})` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Rule Name">
                  <input
                    value={form.rule_name}
                    onChange={(e) => setForm((p) => ({ ...p, rule_name: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Applies To">
                    <select
                      value={form.applies_to}
                      onChange={(e) => setForm((p) => ({ ...p, applies_to: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    >
                      <option value="transport">Transport</option>
                      <option value="hotel">Hotel</option>
                      <option value="package">Package</option>
                      <option value="all">All</option>
                    </select>
                  </Field>

                  <Field label="Mode">
                    <select
                      value={form.commission_mode}
                      onChange={(e) => setForm((p) => ({ ...p, commission_mode: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                    >
                      <option value="percent">Percent</option>
                      <option value="fixed">Fixed</option>
                    </select>
                  </Field>
                </div>

                <Field label="Value">
                  <input
                    type="number"
                    value={form.commission_value}
                    onChange={(e) => setForm((p) => ({ ...p, commission_value: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </Field>

                <Field label="Notes">
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </Field>

                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                  />
                  Rule active
                </label>

                <button
                  onClick={saveRule}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Save Commission Rule
                </button>
              </div>
            </div>

            <div className="xl:col-span-2 space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">Commission Summary</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Agent</th>
                        <th className="px-6 py-4 font-semibold">Gross Sales</th>
                        <th className="px-6 py-4 font-semibold">Total</th>
                        <th className="px-6 py-4 font-semibold">Paid</th>
                        <th className="px-6 py-4 font-semibold">Pending</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map((row) => (
                        <tr key={row.agent_id} className="border-t border-slate-100">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{row.agent_name}</div>
                            <div className="text-xs text-slate-500">{row.agent_code || "—"}</div>
                          </td>
                          <td className="px-6 py-4">PKR {money(row.gross_sales)}</td>
                          <td className="px-6 py-4">PKR {money(row.total_commission)}</td>
                          <td className="px-6 py-4">PKR {money(row.paid_commission)}</td>
                          <td className="px-6 py-4">PKR {money(row.pending_commission)}</td>
                        </tr>
                      ))}
                      {summary.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                            No commission summary yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">Commission Entries</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Agent</th>
                        <th className="px-6 py-4 font-semibold">Type</th>
                        <th className="px-6 py-4 font-semibold">Gross</th>
                        <th className="px-6 py-4 font-semibold">Rate</th>
                        <th className="px-6 py-4 font-semibold">Commission</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <tr key={entry.id} className="border-t border-slate-100">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{entry.agent?.name || "—"}</div>
                            <div className="text-xs text-slate-500">{entry.agent?.agent_code || "—"}</div>
                          </td>
                          <td className="px-6 py-4 uppercase">{entry.booking_type}</td>
                          <td className="px-6 py-4">PKR {money(entry.gross_amount)}</td>
                          <td className="px-6 py-4">{entry.commission_pct}%</td>
                          <td className="px-6 py-4">PKR {money(entry.commission_amount)}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                entry.status === "paid"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : entry.status === "approved"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {entry.status === "pending" && (
                                <button
                                  onClick={() => approveEntry(entry.id)}
                                  className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                                >
                                  Approve
                                </button>
                              )}
                              {entry.status !== "paid" && (
                                <button
                                  onClick={() => markPaid(entry.id)}
                                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {entries.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                            No commission entries found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">Saved Rules</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Agent</th>
                        <th className="px-6 py-4 font-semibold">Rule</th>
                        <th className="px-6 py-4 font-semibold">Applies To</th>
                        <th className="px-6 py-4 font-semibold">Mode</th>
                        <th className="px-6 py-4 font-semibold">Value</th>
                        <th className="px-6 py-4 font-semibold">Active</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((rule) => (
                        <tr key={rule.id} className="border-t border-slate-100">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{rule.agent?.name || "—"}</div>
                            <div className="text-xs text-slate-500">{rule.agent?.agent_code || "—"}</div>
                          </td>
                          <td className="px-6 py-4">{rule.rule_name}</td>
                          <td className="px-6 py-4 capitalize">{rule.applies_to}</td>
                          <td className="px-6 py-4 capitalize">{rule.commission_mode}</td>
                          <td className="px-6 py-4">{rule.commission_value}</td>
                          <td className="px-6 py-4">{rule.is_active ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                      {rules.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                            No saved commission rules yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}