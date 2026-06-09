"use client";

import { useEffect, useMemo, useState } from "react";

type ApiData = {
  ok: boolean;
  exchange: any[];
  staff: any[];
  emotions: any[];
  accounting: any[];
  demand: any[];
  error?: string;
};

export default function MarketIntelligencePage() {
  const [data, setData] = useState<ApiData>({
    ok: false,
    exchange: [],
    staff: [],
    emotions: [],
    accounting: [],
    demand: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/accounts/market-intelligence", { cache: "no-store" });
        const json = await res.json();
        setData(json);
      } catch {
        setData((prev) => ({ ...prev, error: "Failed to load market intelligence." }));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const stats = useMemo(() => {
    const availableStock = data.exchange.reduce((sum, x) => sum + Number(x.available_qty || 0), 0);
    const openAccountingIssues = data.accounting.filter((x) => x.status === "open").length;
    const avgEmotionTrust =
      data.emotions.length > 0
        ? Math.round(data.emotions.reduce((s, x) => s + Number(x.trust_score || 0), 0) / data.emotions.length)
        : 0;

    return {
      exchangeItems: data.exchange.length,
      availableStock,
      staffProfiles: data.staff.length,
      openAccountingIssues,
      avgEmotionTrust,
      demandRegions: data.demand.length,
    };
  }, [data]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
                Arfeen Travel Intelligence
              </p>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">
                Real-Time Umrah Market Intelligence
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                B2B market exchange, AI staff truth engine, pilgrim emotion analytics,
                self-healing accounting, and global Umrah demand satellite in one command center.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4 text-right">
              <p className="text-sm text-emerald-200">System Mode</p>
              <p className="text-2xl font-bold text-emerald-300">LIVE AI</p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
            Loading intelligence dashboard...
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <Stat title="Exchange Items" value={stats.exchangeItems} />
              <Stat title="Available Stock" value={stats.availableStock} />
              <Stat title="Staff Profiles" value={stats.staffProfiles} />
              <Stat title="Accounting Alerts" value={stats.openAccountingIssues} />
              <Stat title="Trust Score" value={`${stats.avgEmotionTrust}%`} />
              <Stat title="Demand Regions" value={stats.demandRegions} />
            </section>

            <Section title="Real-Time Umrah Market Exchange" subtitle="Hotel inventory, transport seats, visa slots, and group seats marketplace.">
              <Table
                rows={data.exchange}
                columns={[
                  ["item_type", "Type"],
                  ["title", "Title"],
                  ["city", "City"],
                  ["supplier_name", "Supplier"],
                  ["available_qty", "Qty"],
                  ["asking_price", "Price"],
                  ["currency", "Currency"],
                  ["status", "Status"],
                ]}
              />
            </Section>

            <Section title="AI Staff Performance Truth Engine" subtitle="Detect productive staff, fake busy behavior, refund damage, sales closing, and client loss.">
              <Table
                rows={data.staff}
                columns={[
                  ["staff_name", "Staff"],
                  ["department", "Department"],
                  ["productivity_score", "Productivity"],
                  ["fake_busy_score", "Fake Busy"],
                  ["refund_damage_score", "Refund Damage"],
                  ["sales_close_score", "Sales Close"],
                  ["client_loss_score", "Client Loss"],
                  ["ai_verdict", "AI Verdict"],
                ]}
              />
            </Section>

            <Section title="Pilgrim Emotion Analytics" subtitle="WhatsApp and feedback tone intelligence for anger, stress, urgency, trust, and satisfaction.">
              <Table
                rows={data.emotions}
                columns={[
                  ["customer_name", "Customer"],
                  ["journey_stage", "Journey Stage"],
                  ["anger_score", "Anger"],
                  ["satisfaction_score", "Satisfaction"],
                  ["stress_score", "Stress"],
                  ["urgency_score", "Urgency"],
                  ["trust_score", "Trust"],
                  ["ai_summary", "AI Summary"],
                ]}
              />
            </Section>

            <Section title="AI Self-Healing Accounting" subtitle="Duplicate voucher, wrong ledger, abnormal supplier balance, and mismatch detection.">
              <Table
                rows={data.accounting}
                columns={[
                  ["issue_type", "Issue"],
                  ["severity", "Severity"],
                  ["voucher_ref", "Voucher"],
                  ["ledger_name", "Ledger"],
                  ["detected_problem", "Problem"],
                  ["suggested_fix", "Suggested Fix"],
                  ["auto_fix_available", "Auto Fix"],
                  ["status", "Status"],
                ]}
              />
            </Section>

            <Section title="Global Umrah Demand Satellite" subtitle="Country and region-wise Umrah demand rise, growth forecast, and strategic notes.">
              <Table
                rows={data.demand}
                columns={[
                  ["country", "Country"],
                  ["region", "Region"],
                  ["demand_score", "Demand"],
                  ["trend", "Trend"],
                  ["top_package_type", "Top Package"],
                  ["expected_growth_pct", "Growth %"],
                  ["strategic_note", "Strategic Note"],
                ]}
              />
            </Section>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Table({
  rows,
  columns,
}: {
  rows: any[];
  columns: [string, string][];
}) {
  if (!rows?.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
        No records yet. SQL table is ready; data will appear after insertion/import.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-white/10">
          <tr>
            {columns.map(([key, label]) => (
              <th key={key} className="px-4 py-3 text-left font-semibold text-slate-200">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((row, index) => (
            <tr key={row.id ?? index} className="hover:bg-white/5">
              {columns.map(([key]) => (
                <td key={key} className="max-w-xs px-4 py-3 text-slate-300">
                  {typeof row[key] === "boolean"
                    ? row[key]
                      ? "Yes"
                      : "No"
                    : row[key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}