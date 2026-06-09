"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileWarning,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  WalletCards,
  XCircle,
  Zap,
} from "lucide-react";

type Refund = {
  id: string;
  refund_no: string;
  refund_type: string;
  booking_ref: string | null;
  customer_name: string;
  supplier_name: string;
  agent_name?: string | null;
  refund_amount: number;
  supplier_recovery_amount?: number;
  net_customer_refund: number;
  status: string;
  supplier_reconciled: boolean;
  fraud_risk_score: number;
  approval_required?: boolean;
  approval_level?: string;
  risk_reason?: string | null;
  profit_impact?: number;
  profit_leak_amount?: number;
  profit_leak_level?: string;
  commission_hold?: boolean;
  duplicate_warning?: boolean;
  refund_stage?: string | null;
  evidence_url?: string | null;
  evidence_validation_status?: string | null;
  evidence_validation_note?: string | null;
  ai_reasoner_summary?: string | null;
  supplier_reconciliation_due_date?: string | null;
  supplier_aging_days?: number;
  pending_reconciliation_alert?: boolean;
  agent_score_penalty?: number;
  created_at?: string;
  paid_at?: string | null;
};

const currency = (n: number) =>
  `PKR ${Number(n || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

const riskColor = (score: number) => {
  if (score >= 81) return "bg-red-100 text-red-700 border-red-200";
  if (score >= 61) return "bg-orange-100 text-orange-700 border-orange-200";
  if (score >= 31) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
};

const leakColor = (level?: string) => {
  if (level === "critical") return "bg-red-100 text-red-700 border-red-200";
  if (level === "high") return "bg-orange-100 text-orange-700 border-orange-200";
  if (level === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
};

const statusColor = (status: string) => {
  if (status.includes("rejected")) return "bg-red-100 text-red-700";
  if (status.includes("paid") || status.includes("reconciled")) return "bg-emerald-100 text-emerald-700";
  if (status.includes("approved")) return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-700";
};

export default function RefundControlPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    refund_type: "transport",
    booking_ref: "",
    customer_name: "",
    supplier_name: "",
    agent_name: "",
    refund_amount: "",
    supplier_recovery_amount: "",
    net_customer_refund: "",
    refund_reason: "",
    evidence_url: "",
  });

  async function loadRefunds() {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts/refunds", { cache: "no-store" });
      const json = await res.json();
      setRefunds(Array.isArray(json.refunds) ? json.refunds : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRefunds();
  }, []);

  const summary = useMemo(() => {
    const total = refunds.length;
    const moneyAtRisk = refunds.reduce(
      (s, r) => s + (r.fraud_risk_score >= 61 ? Number(r.refund_amount || 0) : 0),
      0
    );

    const supplierStuck = refunds.reduce(
      (s, r) =>
        s +
        (r.pending_reconciliation_alert || !r.supplier_reconciled
          ? Number(r.supplier_recovery_amount || 0)
          : 0),
      0
    );

    const profitLeak = refunds.reduce((s, r) => s + Number(r.profit_leak_amount || 0), 0);
    const commissionHolds = refunds.filter((r) => r.commission_hold).length;
    const critical = refunds.filter((r) => r.fraud_risk_score >= 81).length;
    const agingAlerts = refunds.filter((r) => r.pending_reconciliation_alert).length;

    return { total, moneyAtRisk, supplierStuck, profitLeak, commissionHolds, critical, agingAlerts };
  }, [refunds]);

  async function createRefund() {
    setSaving(true);
    try {
      const res = await fetch("/api/accounts/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Refund create failed");

      setForm({
        refund_type: "transport",
        booking_ref: "",
        customer_name: "",
        supplier_name: "",
        agent_name: "",
        refund_amount: "",
        supplier_recovery_amount: "",
        net_customer_refund: "",
        refund_reason: "",
        evidence_url: "",
      });

      await loadRefunds();
    } catch (e: any) {
      alert(e.message || "Error");
    } finally {
      setSaving(false);
    }
  }

  async function action(refund_id: string, actionName: string) {
    const note = window.prompt(`Note for ${actionName}?`) || "";

    const res = await fetch("/api/accounts/refunds/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refund_id, action: actionName, actor: "admin", note }),
    });

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "Action failed");
      return;
    }

    await loadRefunds();
  }

  function exportCsv() {
    const header = [
      "Refund No",
      "Booking Ref",
      "Customer",
      "Supplier",
      "Refund Amount",
      "Supplier Recovery",
      "Profit Leak",
      "Risk",
      "Approval",
      "Aging Days",
      "Supplier Alert",
      "Status",
    ];

    const rows = refunds.map((r) => [
      r.refund_no,
      r.booking_ref || "",
      r.customer_name,
      r.supplier_name,
      r.refund_amount,
      r.supplier_recovery_amount || 0,
      r.profit_leak_amount || 0,
      r.fraud_risk_score,
      r.approval_level || "",
      r.supplier_aging_days || 0,
      r.pending_reconciliation_alert ? "Yes" : "No",
      r.status,
    ]);

    const csv = [header, ...rows]
      .map((x) => x.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "refund-control-report.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-xl md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-amber-300">Accounts / Refund Control Center</p>
            <h1 className="mt-2 text-3xl font-black">AI Refund Fraud + Supplier Recovery Command</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Fraud DNA, AI reasoner, evidence validation, supplier aging alerts, profit leak detection,
              agent score penalty, commission hold, and auto voucher posting.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadRefunds}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold hover:bg-white/20"
            >
              <RefreshCcw size={16} /> Refresh
            </button>

            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-black text-slate-950 hover:bg-amber-300"
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-7">
          {[
            ["Total Refunds", summary.total, WalletCards],
            ["Money at Risk", currency(summary.moneyAtRisk), ShieldAlert],
            ["Supplier Stuck", currency(summary.supplierStuck), Clock],
            ["Profit Leak", currency(summary.profitLeak), TrendingDown],
            ["Aging Alerts", summary.agingAlerts, AlertTriangle],
            ["Commission Holds", summary.commissionHolds, FileWarning],
            ["Critical Risk", summary.critical, Zap],
          ].map(([label, value, Icon]: any) => (
            <div key={label} className="rounded-3xl border bg-white p-5 shadow-sm">
              <Icon className="mb-3 text-slate-500" size={22} />
              <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
              <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-900">Create AI Checked Refund Request</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <select
              value={form.refund_type}
              onChange={(e) => setForm({ ...form, refund_type: e.target.value })}
              className="rounded-2xl border px-4 py-3 text-sm"
            >
              <option value="transport">Transport</option>
              <option value="hotel">Hotel</option>
              <option value="visa">Visa</option>
              <option value="flight">Flight</option>
              <option value="package">Package</option>
            </select>

            <input
              className="rounded-2xl border px-4 py-3 text-sm"
              placeholder="Booking Ref"
              value={form.booking_ref}
              onChange={(e) => setForm({ ...form, booking_ref: e.target.value })}
            />

            <input
              className="rounded-2xl border px-4 py-3 text-sm"
              placeholder="Customer Name"
              value={form.customer_name}
              onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
            />

            <input
              className="rounded-2xl border px-4 py-3 text-sm"
              placeholder="Supplier Name"
              value={form.supplier_name}
              onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
            />

            <input
              className="rounded-2xl border px-4 py-3 text-sm"
              placeholder="Agent Name"
              value={form.agent_name}
              onChange={(e) => setForm({ ...form, agent_name: e.target.value })}
            />

            <input
              className="rounded-2xl border px-4 py-3 text-sm"
              placeholder="Refund Amount"
              type="number"
              value={form.refund_amount}
              onChange={(e) => setForm({ ...form, refund_amount: e.target.value })}
            />

            <input
              className="rounded-2xl border px-4 py-3 text-sm"
              placeholder="Supplier Recovery Amount"
              type="number"
              value={form.supplier_recovery_amount}
              onChange={(e) => setForm({ ...form, supplier_recovery_amount: e.target.value })}
            />

            <input
              className="rounded-2xl border px-4 py-3 text-sm"
              placeholder="Net Customer Refund"
              type="number"
              value={form.net_customer_refund}
              onChange={(e) => setForm({ ...form, net_customer_refund: e.target.value })}
            />

            <input
              className="rounded-2xl border px-4 py-3 text-sm md:col-span-2"
              placeholder="Refund Reason"
              value={form.refund_reason}
              onChange={(e) => setForm({ ...form, refund_reason: e.target.value })}
            />

            <input
              className="rounded-2xl border px-4 py-3 text-sm md:col-span-2"
              placeholder="Evidence URL / WhatsApp proof / supplier confirmation link"
              value={form.evidence_url}
              onChange={(e) => setForm({ ...form, evidence_url: e.target.value })}
            />
          </div>

          <button
            onClick={createRefund}
            disabled={saving}
            className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create Refund With AI Reasoner"}
          </button>
        </section>

        <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="border-b p-5">
            <h2 className="text-lg font-black text-slate-900">Refund Risk Register</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">Refund</th>
                  <th className="p-4">Customer / Supplier</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Fraud DNA</th>
                  <th className="p-4">Profit Leak</th>
                  <th className="p-4">Supplier Aging</th>
                  <th className="p-4">AI Reasoner</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      Loading refund control...
                    </td>
                  </tr>
                ) : refunds.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      No refunds found.
                    </td>
                  </tr>
                ) : (
                  refunds.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-slate-50">
                      <td className="p-4">
                        <p className="font-black text-slate-900">{r.refund_no}</p>
                        <p className="text-xs text-slate-500">
                          {r.refund_type} · {r.booking_ref || "No booking ref"}
                        </p>

                        {r.duplicate_warning && (
                          <p className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700">
                            Duplicate warning
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        <p className="font-bold text-slate-900">{r.customer_name}</p>
                        <p className="text-xs text-slate-500">{r.supplier_name}</p>
                        <p className="text-xs text-slate-400">{r.agent_name || "No agent"}</p>
                        {(r.agent_score_penalty || 0) > 0 && (
                          <p className="mt-1 text-xs font-black text-red-600">
                            Agent score -{r.agent_score_penalty}
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        <p className="font-black text-slate-900">{currency(r.refund_amount)}</p>
                        <p className="text-xs text-slate-500">
                          Supplier recovery: {currency(r.supplier_recovery_amount || 0)}
                        </p>
                        <p className="text-xs text-slate-500">
                          Customer refund: {currency(r.net_customer_refund)}
                        </p>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${riskColor(
                            r.fraud_risk_score
                          )}`}
                        >
                          Risk {r.fraud_risk_score}%
                        </span>

                        <p className="mt-2 max-w-xs text-xs text-slate-500">
                          {r.risk_reason || "Clean refund pattern"}
                        </p>

                        {r.commission_hold && (
                          <p className="mt-1 text-xs font-black text-red-600">
                            Commission Hold Active
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${leakColor(
                            r.profit_leak_level
                          )}`}
                        >
                          {r.profit_leak_level || "none"}
                        </span>

                        <p className="mt-2 text-xs font-bold text-slate-700">
                          Leak: {currency(r.profit_leak_amount || 0)}
                        </p>

                        {(r.profit_leak_amount || 0) > 0 && (
                          <p className="mt-1 text-xs font-black text-red-600">
                            Negative Profit Alert
                          </p>
                        )}
                      </td>

                      <td className="p-4">
                        {r.pending_reconciliation_alert ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                            <AlertTriangle size={13} /> Pending Recovery
                          </span>
                        ) : r.supplier_reconciled ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                            <ShieldCheck size={13} /> Reconciled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                            <Clock size={13} /> Waiting
                          </span>
                        )}

                        <p className="mt-2 text-xs text-slate-500">
                          Aging: {r.supplier_aging_days || 0} days
                        </p>
                        <p className="text-xs text-slate-400">
                          Due: {r.supplier_reconciliation_due_date || "Not set"}
                        </p>
                      </td>

                      <td className="p-4">
                        <div className="max-w-xs rounded-2xl border bg-slate-50 p-3">
                          <div className="mb-2 flex items-center gap-2 text-xs font-black text-slate-700">
                            <BrainCircuit size={14} /> AI Reasoner
                          </div>

                          <p className="text-xs text-slate-600">
                            {r.ai_reasoner_summary || "No AI reasoner summary."}
                          </p>

                          <p className="mt-2 text-xs font-bold text-slate-500">
                            Evidence: {r.evidence_validation_status || "not_checked"}
                          </p>

                          {r.evidence_validation_note && (
                            <p className="mt-1 text-xs text-slate-400">
                              {r.evidence_validation_note}
                            </p>
                          )}

                          {r.evidence_url && (
                            <a
                              href={r.evidence_url}
                              target="_blank"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-blue-600"
                            >
                              <Eye size={13} /> View Evidence
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${statusColor(r.status)}`}>
                          {r.status}
                        </span>
                        <p className="mt-2 text-xs text-slate-500">{r.refund_stage || ""}</p>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => action(r.id, "approve")}
                            className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"
                          >
                            <CheckCircle2 size={13} className="inline" /> Approve
                          </button>

                          <button
                            onClick={() => action(r.id, "reject")}
                            className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
                          >
                            <XCircle size={13} className="inline" /> Reject
                          </button>

                          <button
                            onClick={() => action(r.id, "mark_paid")}
                            className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"
                          >
                            Paid
                          </button>

                          <button
                            onClick={() => action(r.id, "reconcile_supplier")}
                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700"
                          >
                            Reconcile
                          </button>

                          <button
                            onClick={() => action(r.id, "hold_commission")}
                            className="rounded-xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700"
                          >
                            Hold
                          </button>

                          <button
                            onClick={() => action(r.id, "run_ai_review")}
                            className="rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700"
                          >
                            AI Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}