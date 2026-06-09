"use client";

import { useEffect, useMemo, useState } from "react";

const opTypes = [
  "roznamcha_posting",
  "voucher_approval",
  "voucher_locking",
  "reversal_accounting",
  "auto_adjustment",
  "suspense_account",
  "forex_gain_loss",
  "consultant_productivity",
  "booking_failure",
  "supplier_performance",
  "refund_analysis",
  "cancellation_trend",
  "operational_sla",
  "day_wise_movement",
  "ticket_issue_timing",
];

const jobTypes = ["cache", "queue", "background_job", "retry", "notification", "backup", "restore"];

export default function OperationsControlPage() {
  const [operations, setOperations] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    op_type: "roznamcha_posting",
    title: "",
    reference_no: "",
    consultant_name: "",
    supplier_name: "",
    amount: "",
    currency: "PKR",
    debit_account: "",
    credit_account: "",
    priority: "normal",
    issue_reason: "",
    action_note: "",
  });

  const [jobForm, setJobForm] = useState({
    job_name: "",
    job_type: "background_job",
  });

  async function loadAll() {
    setError("");

    const [opsRes, sysRes] = await Promise.all([
      fetch(`/api/accounts/operations-control?type=${type}&status=${status}`, { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/accounts/system-control", { cache: "no-store" }).then((r) => r.json()),
    ]);

    setOperations(opsRes.operations || []);
    setJobs(sysRes.jobs || []);
    setLogs(sysRes.logs || []);
  }

  useEffect(() => {
    loadAll();
  }, [type, status]);

  const stats = useMemo(() => {
    return {
      pending: operations.filter((x) => x.status === "pending").length,
      approved: operations.filter((x) => x.status === "approved").length,
      posted: operations.filter((x) => x.status === "posted").length,
      locked: operations.filter((x) => x.status === "locked").length,
      failedJobs: jobs.filter((x) => x.status === "failed").length,
      critical: operations.filter((x) => x.priority === "critical").length,
    };
  }, [operations, jobs]);

  async function createOperation(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/accounts/operations-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    if (!res.ok) return setError(json.error || "Operation create failed");

    setForm({
      op_type: "roznamcha_posting",
      title: "",
      reference_no: "",
      consultant_name: "",
      supplier_name: "",
      amount: "",
      currency: "PKR",
      debit_account: "",
      credit_account: "",
      priority: "normal",
      issue_reason: "",
      action_note: "",
    });

    loadAll();
  }

  async function runAction(id: string, action: string) {
    const note = action === "reject" ? prompt("Reason?") || "" : "";

    const res = await fetch("/api/accounts/operations-control/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, actor: "admin", note }),
    });

    const json = await res.json();
    if (!res.ok) setError(json.error || "Action failed");
    else loadAll();
  }

  async function createJob(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/accounts/system-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jobForm),
    });

    const json = await res.json();
    if (!res.ok) return setError(json.error || "Job create failed");

    setJobForm({ job_name: "", job_type: "background_job" });
    loadAll();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-purple-950 to-blue-950 p-6 text-white shadow-xl">
          <p className="text-sm text-purple-100">Accounts / Operations Intelligence</p>
          <h1 className="mt-1 text-3xl font-black">Operations Control Tower</h1>
          <p className="mt-2 max-w-5xl text-sm text-purple-100">
            Roznamcha posting approval, voucher locking, reversal accounting, suspense accounts,
            forex gain/loss, productivity, failure reports, SLA reports, background jobs,
            notification center, activity timeline, centralized logs, monitoring and backup/restore UI.
          </p>
        </section>

        {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{error}</div>}

        <section className="grid gap-4 md:grid-cols-6">
          <Card title="Pending" value={stats.pending} />
          <Card title="Approved" value={stats.approved} />
          <Card title="Posted" value={stats.posted} />
          <Card title="Locked" value={stats.locked} />
          <Card title="Failed Jobs" value={stats.failedJobs} danger />
          <Card title="Critical" value={stats.critical} danger />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={createOperation} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-950">Create Control Entry</h2>

            <div className="mt-4 space-y-3">
              <select className="input" value={form.op_type} onChange={(e) => setForm({ ...form, op_type: e.target.value })}>
                {opTypes.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>

              <input required className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className="input" placeholder="Reference No / Voucher No / Booking No" value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} />
              <input className="input" placeholder="Consultant Name" value={form.consultant_name} onChange={(e) => setForm({ ...form, consultant_name: e.target.value })} />
              <input className="input" placeholder="Supplier Name" value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} />

              <div className="grid grid-cols-2 gap-3">
                <input className="input" type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <input className="input" placeholder="Debit Account" value={form.debit_account} onChange={(e) => setForm({ ...form, debit_account: e.target.value })} />
              <input className="input" placeholder="Credit Account" value={form.credit_account} onChange={(e) => setForm({ ...form, credit_account: e.target.value })} />

              <textarea className="input min-h-24" placeholder="Issue / Reason / Action Note" value={form.issue_reason} onChange={(e) => setForm({ ...form, issue_reason: e.target.value })} />

              <button className="btn">Create Entry</button>
            </div>
          </form>

          <div className="lg:col-span-2 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-bold text-slate-950">Posting Approval & Audit Timeline</h2>

              <div className="flex gap-2">
                <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="all">all types</option>
                  {opTypes.map((x) => <option key={x} value={x}>{x}</option>)}
                </select>

                <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {["all","pending","approved","rejected","posted","locked","failed","resolved"].map((x) => (
                    <option key={x} value={x}>{x}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-3">Entry</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.length === 0 ? (
                    <tr><td colSpan={6} className="p-4 text-slate-500">No records found.</td></tr>
                  ) : operations.map((x) => (
                    <tr key={x.id} className="border-b border-slate-100">
                      <td className="p-3">
                        <div className="font-bold text-slate-950">{x.op_no}</div>
                        <div className="text-xs text-slate-500">{x.title}</div>
                        <div className="text-xs text-slate-400">{x.reference_no || "No ref"}</div>
                      </td>
                      <td className="p-3">{x.op_type}</td>
                      <td className="p-3 font-bold">{Number(x.amount || 0).toLocaleString()} {x.currency}</td>
                      <td className="p-3"><Badge text={x.priority} danger={x.priority === "critical"} /></td>
                      <td className="p-3"><Badge text={x.status} /></td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <SmallBtn text="Approve" onClick={() => runAction(x.id, "approve")} />
                          <SmallBtn text="Post" onClick={() => runAction(x.id, "post")} />
                          <SmallBtn text="Lock" onClick={() => runAction(x.id, "lock")} />
                          <SmallBtn text="Resolve" onClick={() => runAction(x.id, "resolve")} />
                          <SmallBtn text="Reject" danger onClick={() => runAction(x.id, "reject")} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={createJob} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-950">Queue / Backup / Retry Engine</h2>
            <div className="mt-4 space-y-3">
              <input required className="input" placeholder="Job Name" value={jobForm.job_name} onChange={(e) => setJobForm({ ...jobForm, job_name: e.target.value })} />
              <select className="input" value={jobForm.job_type} onChange={(e) => setJobForm({ ...jobForm, job_type: e.target.value })}>
                {jobTypes.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              <button className="btn">Queue Job</button>
            </div>
          </form>

          <Panel title="Background Jobs / Retry Engine" items={jobs} mode="jobs" />
          <Panel title="Notification Center / Centralized Logs" items={logs} mode="logs" />
        </section>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: rgb(15 23 42);
          box-shadow: 0 0 0 3px rgb(15 23 42 / 0.08);
        }
        .btn {
          width: 100%;
          border-radius: 1rem;
          background: rgb(15 23 42);
          color: white;
          padding: 0.85rem 1rem;
          font-size: 0.875rem;
          font-weight: 800;
        }
      `}</style>
    </main>
  );
}

function Card({ title, value, danger }: any) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-black ${danger ? "text-red-700" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function Badge({ text, danger }: any) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${danger ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`}>
      {text}
    </span>
  );
}

function SmallBtn({ text, onClick, danger }: any) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-xs font-bold ${
        danger ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
      }`}
    >
      {text}
    </button>
  );
}

function Panel({ title, items, mode }: any) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No records.</p>
        ) : items.map((x: any) => (
          <div key={x.id} className="rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between gap-3">
              <b className="text-sm text-slate-950">{mode === "jobs" ? x.job_name : x.title}</b>
              <Badge text={mode === "jobs" ? x.status : x.severity} danger={x.status === "failed" || x.severity === "critical"} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {mode === "jobs" ? x.job_type : x.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}