"use client";

import React from "react";

export default function AccountsHomePage() {
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <section className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-amber-300 md:text-sm">
            ARFEEN TRAVEL · FINANCE & ACCOUNTS
          </p>

          <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
            Accounting & Financial Control Center
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm text-slate-300 md:text-xl">
            Manage invoices, ledgers, statements and future accounting reports
            from one professional finance workspace inside the Arfeen Travel
            portal.
          </p>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold md:text-lg">
                Finance Modules
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-wide text-emerald-300 md:text-xs">
                Portal Ready
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatCard
                title="Invoices"
                value="Live"
                accent="text-emerald-300"
              />
              <StatCard
                title="Statements"
                value="Planned"
                accent="text-amber-300"
              />
              <StatCard
                title="Reports"
                value="Growing"
                accent="text-sky-300"
              />
            </div>

            <p className="mt-5 text-sm text-slate-400">
              This area is designed for invoice generation, accounting summaries,
              agent statements, ledger visibility and finance reporting across
              the travel portal.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-6">
            <h3 className="mb-3 text-lg font-semibold">Why this matters</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
              <li>Clear visibility on invoice output from bookings</li>
              <li>Future-ready accounting reports and reconciliations</li>
              <li>Agent-wise settlement and aging support</li>
              <li>Centralised finance workflow for scale</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <ModuleCard
            title="Invoices"
            description="View, print and download invoices generated from bookings."
            href="/invoices"
            cta="Open Module"
            accent="emerald"
            disabled={false}
          />

          <ModuleCard
            title="Trial Balance"
            description="Future accounting reports from chart of accounts, debit/credit balancing and financial control."
            href="#"
            cta="Coming Soon"
            accent="amber"
            disabled
          />

          <ModuleCard
            title="Agent Statements"
            description="Future agent-wise statement, settlement and aging report for better B2B control."
            href="#"
            cta="Coming Soon"
            accent="sky"
            disabled
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <InfoCard
            title="Planned accounting expansion"
            items={[
              "Ledger drill-down by booking and invoice",
              "Agent balance visibility and aging buckets",
              "Profit and expense dashboards",
              "Downloadable reports for operations and management",
            ]}
          />

          <InfoCard
            title="Recommended next finance modules"
            items={[
              "General ledger",
              "Cashbook / bankbook",
              "Supplier payable tracking",
              "Agent receivable reconciliation",
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className={`mt-3 text-3xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  href,
  cta,
  accent,
  disabled,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  accent: "emerald" | "amber" | "sky";
  disabled?: boolean;
}) {
  const accentMap = {
    emerald: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10",
    amber: "text-amber-300 border-amber-500/30 bg-amber-500/10",
    sky: "text-sky-300 border-sky-500/30 bg-sky-500/10",
  };

  const badgeClass = accentMap[accent];

  if (disabled) {
    return (
      <div className="flex min-h-[240px] flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl opacity-90">
        <div>
          <div
            className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-wide ${badgeClass}`}
          >
            Planned Module
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-white">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
        </div>

        <div className="mt-6">
          <span className="inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400">
            {cta}
          </span>
        </div>
      </div>
    );
  }

  return (
    <a
      href={href}
      className="flex min-h-[240px] flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900"
    >
      <div>
        <div
          className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-wide ${badgeClass}`}
        >
          Active Module
        </div>
        <h3 className="mt-4 text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
      </div>

      <div className="mt-6">
        <span className="inline-flex rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
          {cta}
        </span>
      </div>
    </a>
  );
}

function InfoCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
      <h3 className="mb-3 text-lg font-semibold text-white">{title}</h3>
      <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}