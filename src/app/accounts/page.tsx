"use client";

import Link from "next/link";
import React from "react";

type Accent = "emerald" | "amber" | "sky" | "violet" | "rose";

const modules = [
  {
    title: "Chart of Accounts",
    description: "Assets, liabilities, equity, income and expense accounts ka complete setup.",
    href: "/accounts/chart-of-accounts",
    cta: "Open Chart",
    accent: "amber" as Accent,
  },
  {
    title: "Invoices",
    description: "Invoices create, view, print aur customer billing manage karein.",
    href: "/accounts/invoices",
    cta: "Open Invoices",
    accent: "emerald" as Accent,
  },
  {
    title: "New Invoice",
    description: "Nayi invoice generate karein with clean billing workflow.",
    href: "/accounts/invoices/new",
    cta: "Create Invoice",
    accent: "sky" as Accent,
  },
  {
    title: "Journal Entry",
    description: "Debit / credit journal entries professional accounting format mein post karein.",
    href: "/accounts/journal-entry",
    cta: "Post Entry",
    accent: "violet" as Accent,
  },
  {
    title: "Ledger",
    description: "Account-wise ledger movement, balances aur transaction drill-down.",
    href: "/accounts/ledger",
    cta: "Open Ledger",
    accent: "emerald" as Accent,
  },
  {
    title: "Agent Ledger",
    description: "Agent-wise receivable, payable, settlements aur outstanding tracking.",
    href: "/accounts/agent-ledger",
    cta: "Open Agent Ledger",
    accent: "sky" as Accent,
  },
  {
    title: "Cash Book",
    description: "Cash receipts, payments aur running cash position monitor karein.",
    href: "/accounts/cash-book",
    cta: "Open Cash Book",
    accent: "amber" as Accent,
  },
  {
    title: "Bank Book",
    description: "Bank transactions, deposits, payments aur reconciliation view.",
    href: "/accounts/bank-book",
    cta: "Open Bank Book",
    accent: "emerald" as Accent,
  },
  {
    title: "Trial Balance",
    description: "Debit, credit aur closing balance ka accounting summary.",
    href: "/accounts/trial-balance",
    cta: "Open Trial Balance",
    accent: "violet" as Accent,
  },
  {
    title: "Profit & Loss",
    description: "Income, expenses aur net profit/loss ka business report.",
    href: "/accounts/profit-loss",
    cta: "Open P&L",
    accent: "rose" as Accent,
  },
  {
    title: "Balance Sheet",
    description: "Assets, liabilities aur equity ka structured financial position report.",
    href: "/accounts/balance-sheet",
    cta: "Open Balance Sheet",
    accent: "sky" as Accent,
  },
  {
    title: "Receipt Voucher",
    description: "Customer ya agent se receive amount ka voucher banayein.",
    href: "/accounts/vouchers/receipt",
    cta: "Create Receipt",
    accent: "emerald" as Accent,
  },
  {
    title: "Payment Voucher",
    description: "Supplier, staff ya expense payment ka voucher create karein.",
    href: "/accounts/vouchers/payment",
    cta: "Create Payment",
    accent: "rose" as Accent,
  },
  {
    title: "Cash Voucher",
    description: "Cash-based voucher posting aur approval workflow.",
    href: "/accounts/vouchers/cash",
    cta: "Open Cash Voucher",
    accent: "amber" as Accent,
  },
  {
    title: "Bank Voucher",
    description: "Bank-based voucher posting, cheque/transfer records aur audit trail.",
    href: "/accounts/vouchers/bank",
    cta: "Open Bank Voucher",
    accent: "sky" as Accent,
  },
  {
    title: "Ledger Import",
    description: "Supplier/customer ledger files import, match aur reconcile karein.",
    href: "/accounts/ledger-import",
    cta: "Import Ledger",
    accent: "violet" as Accent,
  },
];

export default function AccountsHomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-2xl sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-300">
                Arfeen Travel · Accounts
              </p>

              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                Accounting & Financial Control Center
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Invoices, vouchers, ledgers, chart of accounts, reports, cash book,
                bank book aur reconciliation modules ko aik professional finance
                workspace se manage karein.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <QuickButton href="/accounts/chart-of-accounts" label="Chart of Accounts" />
                <QuickButton href="/accounts/invoices/new" label="Create Invoice" />
                <QuickButton href="/accounts/journal-entry" label="Journal Entry" />
                <QuickButton href="/accounts/trial-balance" label="Trial Balance" />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-300">
                Finance Snapshot
              </h2>

              <div className="mt-5 grid gap-3">
                <StatCard title="Core Accounting" value="Active" />
                <StatCard title="Voucher Engine" value="Ready" />
                <StatCard title="Reports Layer" value="Live" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MiniInfo title="Invoices" text="Billing, print, download" />
          <MiniInfo title="Ledgers" text="Agent & account balances" />
          <MiniInfo title="Vouchers" text="Receipt, payment, cash, bank" />
          <MiniInfo title="Reports" text="Trial balance, P&L, balance sheet" />
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">Accounts Modules</h2>
              <p className="mt-1 text-sm text-slate-400">
                Aapke existing `/accounts/...` structure ke mutabiq correct routes.
              </p>
            </div>

            <Link
              href="/accounts/chart-of-accounts/new"
              className="inline-flex w-fit rounded-full bg-amber-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg transition hover:bg-amber-300"
            >
              + New Account
            </Link>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <ModuleCard key={module.href} {...module} />
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <InfoCard
            title="Recommended Workflow"
            items={[
              "Pehle Chart of Accounts complete karein.",
              "Phir opening balances aur ledgers verify karein.",
              "Daily receipt/payment vouchers post karein.",
              "End par Trial Balance, P&L aur Balance Sheet check karein.",
            ]}
          />

          <InfoCard
            title="Control Points"
            items={[
              "Duplicate account codes avoid karein.",
              "System accounts ko manually alter na karein.",
              "Voucher posting ke baad ledger effect verify karein.",
              "Cash aur bank book ko daily reconcile karein.",
            ]}
          />
        </section>
      </main>
    </div>
  );
}

function QuickButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-amber-300 hover:text-amber-300"
    >
      {label}
    </Link>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-black text-amber-300">{value}</p>
    </div>
  );
}

function MiniInfo({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function ModuleCard({
  title,
  description,
  href,
  cta,
  accent,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  accent: Accent;
}) {
  const styles: Record<Accent, string> = {
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    sky: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    violet: "border-violet-500/30 bg-violet-500/10 text-violet-300",
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  };

  return (
    <Link
      href={href}
      className="group flex min-h-[210px] flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl transition hover:-translate-y-1 hover:border-slate-600"
    >
      <div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase ${styles[accent]}`}
        >
          Active Module
        </span>

        <h3 className="mt-5 text-xl font-black text-white transition group-hover:text-amber-300">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
      </div>

      <span className="mt-6 inline-flex w-fit rounded-full bg-amber-400 px-5 py-2 text-sm font-black text-slate-950 shadow-md transition group-hover:bg-amber-300">
        {cta}
      </span>
    </Link>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
      <h3 className="text-base font-black text-white">{title}</h3>

      <ul className="mt-4 space-y-3 text-sm text-slate-300">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}