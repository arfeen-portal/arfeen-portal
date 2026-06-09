"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowUpRight,
  BadgeDollarSign,
  CalendarDays,
  FileText,
  Loader2,
  PackageOpen,
  Plane,
  ReceiptText,
  Wallet,
} from "lucide-react";
import Link from "next/link";

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : null;

type DashboardData = {
  stats: {
    bookings: number;
    invoices: number;
    totalSales: number;
    totalInvoices: number;
    ledgerDebit: number;
    ledgerCredit: number;
    balance: number;
  };
  recentBookings: any[];
  recentInvoices: any[];
};

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function AgentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        if (!supabase) {
          setError("Supabase client not configured.");
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          window.location.href = "/login";
          return;
        }

        const meRes = await fetch("/api/agent/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meJson = await meRes.json();

        if (!meJson.ok) {
          window.location.href = "/login";
          return;
        }

        setMe(meJson);

        const dashRes = await fetch("/api/agent/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dashJson = await dashRes.json();

        if (!dashJson.ok) {
          setError(dashJson.error || "Dashboard loading failed.");
          return;
        }

        setData(dashJson);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-3xl bg-white px-6 py-5 shadow-sm">
          <Loader2 className="animate-spin" />
          <span className="font-bold">Loading agent dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 font-bold text-red-700">
        {error}
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-amber-300">
              Agent Portal
            </p>
            <h1 className="mt-4 text-4xl font-black">
              Welcome, {me?.agent?.name || "Agent"}
            </h1>
            <p className="mt-3 max-w-3xl text-slate-300">
              Manage your bookings, packages, hotel demands, invoices and ledger
              from one clean professional workspace.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/agent/bookings/new"
                className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950"
              >
                Create New Booking
              </Link>
              <Link
                href="/agent/hotel-demands"
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white"
              >
                Send Hotel Demand
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-bold text-slate-300">Agent Code</p>
            <p className="mt-2 text-3xl font-black text-amber-300">
              {me?.agent?.agent_code || "N/A"}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-slate-400">Commission</p>
                <p className="mt-1 font-black">
                  {Number(me?.agent?.commission_pct || 0)}%
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-slate-400">Credit Limit</p>
                <p className="mt-1 font-black">
                  {money(Number(me?.agent?.credit_limit || 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Bookings",
            value: stats?.bookings || 0,
            icon: Plane,
          },
          {
            label: "Invoices",
            value: stats?.invoices || 0,
            icon: ReceiptText,
          },
          {
            label: "Total Sales",
            value: money(stats?.totalSales || 0),
            icon: BadgeDollarSign,
          },
          {
            label: "Ledger Balance",
            value: money(stats?.balance || 0),
            icon: Wallet,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-2xl bg-slate-100 p-3">
                  <Icon size={22} />
                </div>
                <ArrowUpRight size={18} className="text-slate-400" />
              </div>
              <p className="mt-6 text-sm font-bold text-slate-500">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-black">{card.value}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black">Recent Bookings</h2>
            <Link
              href="/agent/bookings"
              className="text-sm font-black text-slate-600"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.recentBookings || []).length ? (
              data?.recentBookings.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-black">Booking #{String(row.id).slice(0, 8)}</p>
                    <p className="text-sm text-slate-500">{row.status || "Pending"}</p>
                  </div>
                  <p className="font-black">{money(row.total_price || 0)}</p>
                </div>
              ))
            ) : (
              <Empty icon={CalendarDays} text="No bookings yet." />
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black">Recent Invoices</h2>
            <Link
              href="/agent/invoices"
              className="text-sm font-black text-slate-600"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {(data?.recentInvoices || []).length ? (
              data?.recentInvoices.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-black">Invoice #{String(row.id).slice(0, 8)}</p>
                    <p className="text-sm text-slate-500">{row.status || "Draft"}</p>
                  </div>
                  <p className="font-black">{money(row.total_amount || 0)}</p>
                </div>
              ))
            ) : (
              <Empty icon={FileText} text="No invoices yet." />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {[
          {
            title: "Packages",
            text: "View active Umrah packages assigned to you.",
            href: "/agent/packages",
            icon: PackageOpen,
          },
          {
            title: "Hotel Demand",
            text: "Send offline hotel demand to operation team.",
            href: "/agent/hotel-demands",
            icon: CalendarDays,
          },
          {
            title: "Ledger",
            text: "Track your receivable, payable and balance.",
            href: "/agent/ledger",
            icon: Wallet,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <Icon size={26} />
              <h3 className="mt-5 text-lg font-black">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.text}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}

function Empty({
  icon: Icon,
  text,
}: {
  icon: any;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
      <Icon className="mx-auto text-slate-400" />
      <p className="mt-3 text-sm font-bold text-slate-500">{text}</p>
    </div>
  );
}