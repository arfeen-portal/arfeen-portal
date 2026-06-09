"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = any;

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

const currencies: Record<string, { locale: string; currency: string }> = {
  PKR: { locale: "en-PK", currency: "PKR" },
  SAR: { locale: "ar-SA", currency: "SAR" },
  AED: { locale: "en-AE", currency: "AED" },
  USD: { locale: "en-US", currency: "USD" },
  GBP: { locale: "en-GB", currency: "GBP" },
  TRY: { locale: "tr-TR", currency: "TRY" },
};

function riskClass(risk: string) {
  if (risk === "critical") return "bg-red-100 text-red-700 border-red-200";
  if (risk === "high") return "bg-orange-100 text-orange-700 border-orange-200";
  if (risk === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function bucketLabel(v: string) {
  return (
    {
      current: "Current",
      "1_30": "1-30 Days",
      "31_60": "31-60 Days",
      "61_90": "61-90 Days",
      "90_plus": "90+ Days",
    }[v] || v || "-"
  );
}

export default function AgingReportPage() {
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT_ID);
  const [currency, setCurrency] = useState("PKR");
  const [rows, setRows] = useState<Row[]>([]);
  const [promises, setPromises] = useState<Row[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [search, setSearch] = useState("");
  const [bucket, setBucket] = useState("all");
  const [risk, setRisk] = useState("all");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [tone, setTone] = useState("Negotiation Recovery");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"aging" | "pipeline" | "warroom" | "simulator">("aging");

  const fmt = useMemo(() => {
    const c = currencies[currency] || currencies.PKR;
    return new Intl.NumberFormat(c.locale, { style: "currency", currency: c.currency, maximumFractionDigits: 0 });
  }, [currency]);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ tenant_id: tenantId, search, bucket, risk });
      const res = await fetch(`/api/accounts/reports/aging?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json.success) throw new Error(json.error || "Failed to load aging report.");

      setRows(json.aging || []);
      setPromises(json.promises || []);
      setSummary(json.summary || {});
    } catch (e: any) {
      setError(e.message || "Failed to load.");
    } finally {
      setLoading(false);
    }
  }

  async function reconcilePromises() {
    const res = await fetch("/api/accounts/recovery/reconcile-promises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenantId }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.error || "Reconciliation failed.");
      return;
    }

    alert(`Checked: ${json.checked}, Broken Promises: ${json.broken_promises}`);
    load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, risk]);

  const pipeline = useMemo(() => {
    return {
      promised: promises.filter((p) => p.status === "promised"),
      verified: promises.filter((p) => p.status === "verified"),
      broken: promises.filter((p) => p.status === "broken" || p.legal_triggered),
    };
  }, [promises]);

  function aiMessage(row: Row) {
    const amount = fmt.format(Number(row.balance_amount || 0));
    const invoice = row.invoice_no || "-";

    if (tone === "Strict Finance Mode") {
      return `Assalam o Alaikum,\n\nInvoice ${invoice} ka outstanding balance ${amount} pending hai. Kindly payment clear karein taake further credit/bookings continue reh saken.\n\nAgar payment already processed hai to receipt share kar dein.\n\nRegards,\nArfeen Travel Accounts`;
    }

    if (tone === "VIP Agent Friendly") {
      return `Assalam o Alaikum,\n\nAap hamare valued partner hain. Invoice ${invoice} ka balance ${amount} pending show ho raha hai. Aap convenience ke mutabiq partial payment commitment share kar dein, hum remaining amount structured plan mein adjust kar denge.\n\nJazakAllah,\nArfeen Travel`;
    }

    return `Assalam o Alaikum,\n\nInvoice ${invoice} ka pending balance ${amount} hai. Aap agar aaj partial payment kar dein to remaining amount ke liye suitable payment date lock kar dete hain.\n\nSuggested Plan: 40% today + remaining on agreed date.\n\nRegards,\nArfeen Travel Recovery Team`;
  }

  function sendWhatsApp(row: Row) {
    const phone = String(row.phone || "").replace(/\D/g, "");
    if (!phone) return alert("Phone number missing.");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(aiMessage(row))}`, "_blank");
  }

  function printSOA(row: Row) {
    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>SOA</title>
          <style>
            body{font-family:Arial;padding:30px;color:#0f172a}
            .box{border:1px solid #cbd5e1;border-radius:14px;padding:18px;margin-top:20px}
            .row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e2e8f0}
          </style>
        </head>
        <body>
          <h1>Statement of Account</h1>
          <p>Arfeen Travel</p>
          <div class="box">
            <div class="row"><span>Invoice</span><b>${row.invoice_no || "-"}</b></div>
            <div class="row"><span>Agent / Customer</span><b>${row.agent_name || row.customer_name || "-"}</b></div>
            <div class="row"><span>Aging</span><b>${bucketLabel(row.aging_bucket)}</b></div>
            <div class="row"><span>Trust Score</span><b>${row.propensity_score || 0}%</b></div>
            <div class="row"><span>Estimated Bad Debt</span><b>${fmt.format(Number(row.estimated_bad_debt || 0))}</b></div>
            <div class="row"><span>Balance</span><b>${fmt.format(Number(row.balance_amount || 0))}</b></div>
          </div>
          <script>window.print()</script>
        </body>
      </html>
    `);

    win.document.close();
  }

  const simulatedRecovery = Math.round(Number(summary.total_balance || 0) * 0.28);
  const simulatedStrictRecovery = Math.round(Number(summary.total_balance || 0) * 0.42);
  const simulatedDiscountRecovery = Math.round(Number(summary.total_balance || 0) * 0.51);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-slate-950 p-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300">
                Linked Accounts Intelligence
              </p>
              <h1 className="mt-2 text-3xl font-black">AI Debt Recovery Operating System</h1>
              <p className="mt-2 text-sm text-slate-300">
                Aging, promises, bad debt, WhatsApp AI, voice-to-finance, litigation trigger, ledger and reports — all linked.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/accounts" className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black">Accounts Hub</Link>
              <Link href="/accounts/ledger" className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black">Ledger</Link>
              <Link href="/accounts/agent-ledger" className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black">Agent Ledger</Link>
              <Link href="/accounts/ai-financial-health" className="rounded-xl bg-white/10 px-4 py-2 text-xs font-black">AI Health</Link>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          <Card title="Outstanding" value={fmt.format(Number(summary.total_balance || 0))} />
          <Card title="Bad Debt Risk" value={fmt.format(Number(summary.estimated_bad_debt || 0))} danger />
          <Card title="Invoices" value={summary.total_invoices || 0} />
          <Card title="Avg Trust" value={`${summary.avg_score || 0}%`} />
          <Card title="Promised" value={summary.promised || 0} />
          <Card title="Legal Alerts" value={summary.legal_alerts || 0} danger />
        </div>

        <div className="rounded-3xl border bg-white p-5">
          <div className="grid gap-3 md:grid-cols-6">
            <input value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="rounded-xl border px-4 py-3 text-sm md:col-span-2" placeholder="Tenant ID" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} className="rounded-xl border px-4 py-3 text-sm md:col-span-2" placeholder="Search invoice, agent, phone..." />

            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-xl border px-4 py-3 text-sm">
              {Object.keys(currencies).map((c) => <option key={c}>{c}</option>)}
            </select>

            <button onClick={load} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
              {loading ? "Loading..." : "Apply"}
            </button>

            <select value={bucket} onChange={(e) => setBucket(e.target.value)} className="rounded-xl border px-4 py-3 text-sm">
              <option value="all">All Buckets</option>
              <option value="current">Current</option>
              <option value="1_30">1-30</option>
              <option value="31_60">31-60</option>
              <option value="61_90">61-90</option>
              <option value="90_plus">90+</option>
            </select>

            <select value={risk} onChange={(e) => setRisk(e.target.value)} className="rounded-xl border px-4 py-3 text-sm">
              <option value="all">All Risk</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <button onClick={reconcilePromises} className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white">
              Run Promise Reconciliation
            </button>

            <Link href="/admin/credit-control" className="rounded-xl border px-4 py-3 text-center text-sm font-black">Credit Control</Link>
            <Link href="/accounts/reports/balance-sheet" className="rounded-xl border px-4 py-3 text-center text-sm font-black">Balance Sheet</Link>
            <Link href="/accounts/trial-balance" className="rounded-xl border px-4 py-3 text-center text-sm font-black">Trial Balance</Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["aging", "pipeline", "warroom", "simulator"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`rounded-xl px-4 py-2 text-sm font-black ${activeTab === t ? "bg-slate-950 text-white" : "border bg-white"}`}
            >
              {t === "aging" ? "Aging Report" : t === "pipeline" ? "Recovery Promises Pipeline" : t === "warroom" ? "Recovery War Room" : "AI Recovery Simulator"}
            </button>
          ))}
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

        {activeTab === "aging" && (
          <div className="overflow-hidden rounded-3xl border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-4 text-left">Invoice</th>
                  <th className="px-4 py-4 text-left">Agent / Customer</th>
                  <th className="px-4 py-4 text-left">Aging</th>
                  <th className="px-4 py-4 text-left">AI Risk</th>
                  <th className="px-4 py-4 text-left">Recovery Strategy</th>
                  <th className="px-4 py-4 text-right">Balance</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="p-10 text-center font-bold text-slate-500">Loading...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={7} className="p-10 text-center font-bold text-slate-500">No aging data found.</td></tr>
                ) : rows.map((row, i) => (
                  <tr key={row.id || i} className={`border-t ${row.risk_level === "critical" ? "bg-red-50 animate-pulse" : "hover:bg-slate-50"}`}>
                    <td className="px-4 py-4 font-black">
                      {row.invoice_no || "-"}
                      {row.has_promise && (
                        <div className="mt-1 animate-pulse rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black text-amber-700">
                          ⏰ Promised: {row.promised_date || "-"}
                        </div>
                      )}
                      {row.legal_triggered && (
                        <div className="mt-1 rounded-full bg-red-100 px-2 py-1 text-[10px] font-black text-red-700">
                          ⚖ Legal Watch
                        </div>
                      )}
                      <div className="mt-1 flex gap-2 text-[10px]">
                        <Link className="text-blue-700 underline" href={`/accounts/invoices?invoice_no=${encodeURIComponent(row.invoice_no || "")}`}>Invoice</Link>
                        <Link className="text-blue-700 underline" href={`/accounts/ledger?invoice_no=${encodeURIComponent(row.invoice_no || "")}`}>Ledger</Link>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold">{row.agent_name || row.customer_name || "-"}</div>
                      <div className="text-xs text-slate-500">{row.agent_code || row.phone || ""}</div>
                      <Link className="text-[10px] font-bold text-blue-700 underline" href={`/accounts/agent-ledger?agent_code=${encodeURIComponent(row.agent_code || "")}`}>
                        Agent Ledger
                      </Link>
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{bucketLabel(row.aging_bucket)}</span>
                      <div className="mt-1 text-xs text-slate-500">{row.overdue_days || 0} days overdue</div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-black">{row.propensity_score || 0}% Trust</div>
                      <div className="text-xs text-slate-500">{row.recovery_probability || 0}% recovery probability</div>
                      <span className={`mt-1 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase ${riskClass(row.risk_level)}`}>
                        {row.risk_level}
                      </span>
                    </td>

                    <td className="px-4 py-4 max-w-md">
                      <div className="font-black">{row.action}</div>
                      <div className="text-xs text-slate-500">{row.channel} · {row.urgency}</div>
                      <div className="mt-1 text-xs text-indigo-700">{row.ai_note}</div>
                      <div className="mt-1 text-xs font-bold text-red-700">
                        Bad Debt Risk: {fmt.format(Number(row.estimated_bad_debt || 0))}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-right font-black">{fmt.format(Number(row.balance_amount || 0))}</td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelected(row)} className="rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-black text-white">AI Assist</button>
                        <button onClick={() => sendWhatsApp(row)} className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-black text-white">WhatsApp</button>
                        <button onClick={() => printSOA(row)} className="rounded-lg bg-slate-950 px-3 py-2 text-[11px] font-black text-white">SOA</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "pipeline" && (
          <div className="grid gap-4 md:grid-cols-3">
            <PipelineColumn title="Promised Pending Payment" rows={pipeline.promised} color="amber" fmt={fmt} />
            <PipelineColumn title="Verified Payment Received" rows={pipeline.verified} color="emerald" fmt={fmt} />
            <PipelineColumn title="Broken Promises High Risk" rows={pipeline.broken} color="red" fmt={fmt} />
          </div>
        )}

        {activeTab === "warroom" && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Immediate Calls" value={rows.filter((r) => r.risk_level === "critical").length} danger />
            <Card title="Broken Promise Cases" value={pipeline.broken.length} danger />
            <Card title="Today Recovery Target" value={fmt.format(simulatedStrictRecovery)} />
          </div>
        )}

        {activeTab === "simulator" && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Soft Reminder Expected Recovery" value={fmt.format(simulatedRecovery)} />
            <Card title="Credit Freeze Expected Recovery" value={fmt.format(simulatedStrictRecovery)} danger />
            <Card title="Discount Settlement Expected Recovery" value={fmt.format(simulatedDiscountRecovery)} />
          </div>
        )}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-black">AI Negotiation Assistant</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Invoice {selected.invoice_no} · {fmt.format(Number(selected.balance_amount || 0))}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-xl border px-3 py-2 text-sm font-black">Close</button>
              </div>

              <div className="mt-5">
                <label className="text-xs font-black uppercase text-slate-500">Recovery Tone</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="mt-2 w-full rounded-xl border px-4 py-3 text-sm">
                  <option>Negotiation Recovery</option>
                  <option>Strict Finance Mode</option>
                  <option>VIP Agent Friendly</option>
                </select>
              </div>

              <textarea readOnly value={aiMessage(selected)} className="mt-4 h-56 w-full rounded-2xl border bg-slate-50 p-4 text-sm leading-6" />

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <button onClick={() => sendWhatsApp(selected)} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">Send WhatsApp</button>
                <Link href={`/accounts/invoices?invoice_no=${encodeURIComponent(selected.invoice_no || "")}`} className="rounded-xl border px-4 py-3 text-center text-sm font-black">Open Invoice</Link>
                <Link href={`/accounts/ledger?invoice_no=${encodeURIComponent(selected.invoice_no || "")}`} className="rounded-xl border px-4 py-3 text-center text-sm font-black">Ledger</Link>
                <Link href="/accounts/journal-entry" className="rounded-xl border px-4 py-3 text-center text-sm font-black">Journal</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, danger = false }: { title: string; value: any; danger?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${danger ? "border-red-100 bg-red-50" : "bg-white"}`}>
      <p className={`text-xs font-bold ${danger ? "text-red-600" : "text-slate-500"}`}>{title}</p>
      <p className={`mt-2 text-2xl font-black ${danger ? "text-red-700" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function PipelineColumn({ title, rows, color, fmt }: { title: string; rows: any[]; color: string; fmt: Intl.NumberFormat }) {
  const colorClass =
    color === "red" ? "border-red-100 bg-red-50" :
    color === "emerald" ? "border-emerald-100 bg-emerald-50" :
    "border-amber-100 bg-amber-50";

  return (
    <div className={`rounded-3xl border p-4 ${colorClass}`}>
      <h3 className="text-sm font-black">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">No records</div>
        ) : rows.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="font-black">{p.invoice_no || "-"}</div>
            <div className="text-xs text-slate-500">{p.agent_name || p.customer_name || "-"}</div>
            <div className="mt-2 text-xs font-bold">Date: {p.promised_date || "-"}</div>
            <div className="text-xs font-bold">Amount: {fmt.format(Number(p.promised_amount || 0))}</div>
            {p.legal_triggered && <div className="mt-2 rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">Legal Triggered</div>}
          </div>
        ))}
      </div>
    </div>
  );
}