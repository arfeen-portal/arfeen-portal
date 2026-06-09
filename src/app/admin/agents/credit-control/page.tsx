"use client";

import { useEffect, useMemo, useState } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CreditStatusRow = {
  agent_id: string;
  tenant_id: string;
  agent_name: string;
  agent_code: string | null;
  credit_limit: number;
  is_credit_blocked: boolean;
  total_debit: number;
  total_credit: number;
  outstanding_balance: number;
};

type LedgerRow = {
  id: string;
  tenant_id: string;
  agent_id: string;
  entry_type: "debit" | "credit";
  source_type: string;
  amount: number;
  currency: string | null;
  notes: string | null;
  created_at: string;
  agent?: {
    id: string;
    name: string;
    agent_code: string | null;
  };
};

function money(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function CreditControlPage() {
  const [statusRows, setStatusRows] = useState<CreditStatusRow[]>([]);
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [paymentForm, setPaymentForm] = useState({
    tenant_id: "",
    agent_id: "",
    amount: "",
    currency: "PKR",
    notes: "",
  });

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch("/api/agents/credit-control", { cache: "no-store" });
      const json = await res.json();
      setStatusRows(json?.statusRows || []);
      setLedgerRows(json?.ledgerRows || []);

      const first = (json?.statusRows || [])[0];
      if (first && !paymentForm.agent_id) {
        setPaymentForm((prev) => ({
          ...prev,
          tenant_id: first.tenant_id,
          agent_id: first.agent_id,
        }));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const totals = useMemo(() => {
    return {
      totalOutstanding: statusRows.reduce((sum, row) => sum + Number(row.outstanding_balance || 0), 0),
      totalCreditLimit: statusRows.reduce((sum, row) => sum + Number(row.credit_limit || 0), 0),
      blockedAgents: statusRows.filter((row) => row.is_credit_blocked).length,
    };
  }, [statusRows]);

  async function addPayment() {
    const selected = statusRows.find((s) => s.agent_id === paymentForm.agent_id);

    const res = await fetch("/api/agents/credit-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_payment",
        tenant_id: selected?.tenant_id || paymentForm.tenant_id,
        agent_id: paymentForm.agent_id,
        amount: Number(paymentForm.amount || 0),
        currency: paymentForm.currency,
        notes: paymentForm.notes,
      }),
    });

    const json = await res.json();
    if (!json.ok) {
      alert(json.error || "Failed to add payment");
      return;
    }

    setPaymentForm((prev) => ({ ...prev, amount: "", notes: "" }));
    await loadData();
    alert("Payment added successfully");
  }

  async function toggleBlock(agent_id: string, is_credit_blocked: boolean) {
    const res = await fetch("/api/agents/credit-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_block",
        agent_id,
        is_credit_blocked: !is_credit_blocked,
      }),
    });

    const json = await res.json();
    if (!json.ok) {
      alert(json.error || "Failed to update block status");
      return;
    }

    await loadData();
  }

  async function updateLimit(agent_id: string, credit_limit: number) {
    const input = window.prompt("Enter new credit limit", String(credit_limit || 0));
    if (input === null) return;

    const numericLimit = Number(input || 0);
    if (Number.isNaN(numericLimit)) {
      alert("Invalid credit limit");
      return;
    }

    const res = await fetch("/api/agents/credit-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_limit",
        agent_id,
        credit_limit: numericLimit,
      }),
    });

    const json = await res.json();
    if (!json.ok) {
      alert(json.error || "Failed to update credit limit");
      return;
    }

    await loadData();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-600">Agents</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Credit Control UI
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage limits, payments, outstanding exposure and block risky agents instantly.
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading credit control...
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Total Outstanding" value={`PKR ${money(totals.totalOutstanding)}`} />
            <Card title="Total Credit Limit" value={`PKR ${money(totals.totalCreditLimit)}`} />
            <Card title="Blocked Agents" value={money(totals.blockedAgents)} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Add Payment</h2>

              <div className="mt-5 space-y-4">
                <Field label="Agent">
                  <select
                    value={paymentForm.agent_id}
                    onChange={(e) => {
                      const row = statusRows.find((r) => r.agent_id === e.target.value);
                      setPaymentForm((prev) => ({
                        ...prev,
                        agent_id: e.target.value,
                        tenant_id: row?.tenant_id || "",
                      }));
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  >
                    <option value="">Select agent</option>
                    {statusRows.map((row) => (
                      <option key={row.agent_id} value={row.agent_id}>
                        {row.agent_name} {row.agent_code ? `(${row.agent_code})` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Amount">
                  <input
                    type="number"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </Field>

                <Field label="Currency">
                  <input
                    value={paymentForm.currency}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, currency: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </Field>

                <Field label="Notes">
                  <textarea
                    rows={4}
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                  />
                </Field>

                <button
                  onClick={addPayment}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Add Payment Entry
                </button>
              </div>
            </div>

            <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Credit Exposure</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Agent</th>
                      <th className="px-6 py-4 font-semibold">Debit</th>
                      <th className="px-6 py-4 font-semibold">Credit</th>
                      <th className="px-6 py-4 font-semibold">Outstanding</th>
                      <th className="px-6 py-4 font-semibold">Limit</th>
                      <th className="px-6 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusRows.map((row) => (
                      <tr key={row.agent_id} className="border-t border-slate-100">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{row.agent_name}</div>
                          <div className="text-xs text-slate-500">{row.agent_code || "—"}</div>
                        </td>
                        <td className="px-6 py-4">PKR {money(row.total_debit)}</td>
                        <td className="px-6 py-4">PKR {money(row.total_credit)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`font-semibold ${
                              row.outstanding_balance > row.credit_limit && row.credit_limit > 0
                                ? "text-red-600"
                                : "text-slate-800"
                            }`}
                          >
                            PKR {money(row.outstanding_balance)}
                          </span>
                        </td>
                        <td className="px-6 py-4">PKR {money(row.credit_limit)}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => updateLimit(row.agent_id, row.credit_limit)}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
                            >
                              Update Limit
                            </button>
                            <button
                              onClick={() => toggleBlock(row.agent_id, row.is_credit_blocked)}
                              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                                row.is_credit_blocked
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                  : "border border-red-200 bg-red-50 text-red-700"
                              }`}
                            >
                              {row.is_credit_blocked ? "Unblock" : "Block"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {statusRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                          No credit status data yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Credit Ledger</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Agent</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Source</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-6 py-4 text-slate-700">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{row.agent?.name || "—"}</div>
                        <div className="text-xs text-slate-500">{row.agent?.agent_code || "—"}</div>
                      </td>
                      <td className="px-6 py-4 uppercase">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            row.entry_type === "credit"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {row.entry_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">{row.source_type}</td>
                      <td className="px-6 py-4">
                        {row.currency || "PKR"} {money(row.amount)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{row.notes || "—"}</td>
                    </tr>
                  ))}
                  {ledgerRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                        No ledger entries yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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