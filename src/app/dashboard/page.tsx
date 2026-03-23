"use client";

import { useEffect, useState } from "react";

type RiskAlert = { id: string };

export default function DashboardPage() {
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/risk-alerts");
        const json = await res.json();
        if (res.ok) {
          setAlertCount(
            (json.alerts as RiskAlert[] | undefined)?.length || 0
          );
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <section className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-amber-300 md:text-sm">
            ARFEEN TRAVEL · INTELLIGENCE DASHBOARD
          </p>

          <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
            Portal Command Center
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm text-slate-300 md:text-xl">
            Monitor bookings, finance modules, alerts and strategic travel tools
            from one premium control panel.
          </p>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold md:text-lg">
                Operational Snapshot
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-wide text-emerald-300 md:text-xs">
                Live View
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="Active Risk Alerts"
                value={loading ? "..." : alertCount.toString()}
                subtext="Live from /api/risk-alerts"
                accent="text-red-300"
              />

              <MetricCard
                title="Transport Module"
                value="Ready"
                subtext="Airport + intercity operations"
                accent="text-amber-300"
              />

              <MetricCard
                title="Hotels Module"
                value="Ready"
                subtext="Makkah + Madinah bookings"
                accent="text-sky-300"
              />

              <MetricCard
                title="Finance Area"
                value="Growing"
                subtext="Accounts + accounting layer"
                accent="text-emerald-300"
              />
            </div>

            <p className="mt-5 text-sm text-slate-400">
              This dashboard is the high-level intelligence layer for Arfeen
              Travel. Use it to navigate core modules and monitor operational
              readiness.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-6">
            <h3 className="mb-3 text-lg font-semibold">Dashboard purpose</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
              <li>Surface critical alerts quickly</li>
              <li>Give direct access to core portal modules</li>
              <li>Keep leadership view clean and focused</li>
              <li>Prepare the portal for premium white-label demos</li>
            </ul>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <QuickLinkCard
            title="Risk Alerts"
            value={loading ? "Checking..." : `${alertCount} active`}
            href="/risk-alerts"
            badge="Priority"
            badgeClass="text-red-300 border-red-500/30 bg-red-500/10"
            buttonLabel="Open Alerts"
          />

          <QuickLinkCard
            title="Transport"
            value="Airport · Intercity · Ziyarat"
            href="/transport"
            badge="Operations"
            badgeClass="text-amber-300 border-amber-500/30 bg-amber-500/10"
            buttonLabel="Open Transport"
          />

          <QuickLinkCard
            title="Hotels"
            value="Makkah · Madinah inventory"
            href="/hotels"
            badge="Bookings"
            badgeClass="text-sky-300 border-sky-500/30 bg-sky-500/10"
            buttonLabel="Open Hotels"
          />

          <QuickLinkCard
            title="Accounting"
            value="Finance modules and reporting"
            href="/accounts"
            badge="Finance"
            badgeClass="text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
            buttonLabel="Open Accounts"
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <InfoPanel
            title="Strategic tools pipeline"
            items={[
              "Umrah planning tools",
              "Pakistan tourism expansion",
              "Agent CRM visibility",
              "Future AI suggestions and analytics",
            ]}
          />

          <InfoPanel
            title="Recommended next dashboard blocks"
            items={[
              "Recent bookings activity feed",
              "Top routes and top hotels",
              "Pending payments and receivables",
              "Agent performance snapshot",
            ]}
          />
        </section>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtext,
  accent,
}: {
  title: string;
  value: string;
  subtext: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
      <p className={`mt-3 text-3xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-2 text-sm text-slate-500">{subtext}</p>
    </div>
  );
}

function QuickLinkCard({
  title,
  value,
  href,
  badge,
  badgeClass,
  buttonLabel,
}: {
  title: string;
  value: string;
  href: string;
  badge: string;
  badgeClass: string;
  buttonLabel: string;
}) {
  return (
    <a
      href={href}
      className="flex min-h-[220px] flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900"
    >
      <div>
        <div
          className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-wide ${badgeClass}`}
        >
          {badge}
        </div>

        <h3 className="mt-4 text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300">{value}</p>
      </div>

      <div className="mt-6">
        <span className="inline-flex rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
          {buttonLabel}
        </span>
      </div>
    </a>
  );
}

function InfoPanel({
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