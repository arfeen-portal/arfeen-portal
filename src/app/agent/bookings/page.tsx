"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

export default function CreateAgentLoginPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    country: "",
    city: "",
    commission_pct: "0",
    credit_limit: "0",
    billing_currency: "SAR",
    agent_code: "",
    portal_name: "",
    portal_slug: "",
    theme_key: "classic-blue",
  });

  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/agents/create-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          commission_pct: Number(form.commission_pct || 0),
          credit_limit: Number(form.credit_limit || 0),
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        setError(json.error || "Failed to create agent login.");
        return;
      }

      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/admin/agents"
              className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-500"
            >
              <ArrowLeft size={16} />
              Back to Agents
            </Link>
            <h1 className="text-3xl font-black text-slate-950">
              Create Agent Login
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Create Supabase Auth login, agent profile and separate agent
              portal in one step.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
            Admin Secure Action
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 font-bold text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
            <div className="flex items-center gap-3">
              <CheckCircle2 />
              <h2 className="text-xl font-black">
                Agent login created successfully
              </h2>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Info label="Agent" value={result.agent?.name} />
              <Info label="Email" value={result.agent?.email} />
              <Info label="Agent Code" value={result.agent?.agent_code} />
              <Info label="Portal" value={result.portal?.portal_name} />
              <Info label="Slug" value={result.portal?.portal_slug} />
              <Info label="Status" value={result.agent?.status} />
            </div>
          </div>
        ) : null}

        <form
          onSubmit={submit}
          className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_360px]"
        >
          <section className="space-y-6">
            <Panel
              title="Agent Information"
              icon={<UserPlus size={20} />}
              description="Basic agent profile and business identity."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Agent Name"
                  value={form.name}
                  onChange={(v) => update("name", v)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(v) => update("email", v)}
                  required
                />
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(v) => update("phone", v)}
                />
                <Input
                  label="Agent Code"
                  value={form.agent_code}
                  onChange={(v) => update("agent_code", v)}
                  placeholder="Auto if empty"
                />
                <Input
                  label="Country"
                  value={form.country}
                  onChange={(v) => update("country", v)}
                />
                <Input
                  label="City"
                  value={form.city}
                  onChange={(v) => update("city", v)}
                />
              </div>
            </Panel>

            <Panel
              title="Financial Controls"
              icon={<Building2 size={20} />}
              description="Commission, credit and billing settings."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  label="Commission %"
                  type="number"
                  value={form.commission_pct}
                  onChange={(v) => update("commission_pct", v)}
                />
                <Input
                  label="Credit Limit"
                  type="number"
                  value={form.credit_limit}
                  onChange={(v) => update("credit_limit", v)}
                />
                <Select
                  label="Billing Currency"
                  value={form.billing_currency}
                  onChange={(v) => update("billing_currency", v)}
                  options={["SAR", "PKR", "USD", "AED"]}
                />
              </div>
            </Panel>

            <Panel
              title="Portal Branding"
              icon={<Mail size={20} />}
              description="Separate clean portal identity for this agent."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Portal Name"
                  value={form.portal_name}
                  onChange={(v) => update("portal_name", v)}
                  placeholder="Auto from agent name"
                />
                <Input
                  label="Portal Slug"
                  value={form.portal_slug}
                  onChange={(v) => update("portal_slug", v)}
                  placeholder="example-travel"
                />
                <Select
                  label="Theme"
                  value={form.theme_key}
                  onChange={(v) => update("theme_key", v)}
                  options={[
                    "classic-blue",
                    "premium-gold",
                    "emerald-umrah",
                    "dark-corporate",
                  ]}
                />
              </div>
            </Panel>
          </section>

          <aside className="space-y-5">
            <div className="rounded-3xl bg-slate-950 p-6 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950">
                <Lock />
              </div>
              <h2 className="mt-5 text-xl font-black">Login Credentials</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                This email and password will be used by the agent to login at
                /login.
              </p>

              <div className="mt-5 space-y-4">
                <Input
                  dark
                  label="Login Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => update("email", v)}
                  required
                />
                <Input
                  dark
                  label="Temporary Password"
                  type="text"
                  value={form.password}
                  onChange={(v) => update("password", v)}
                  required
                  placeholder="Minimum 6 characters"
                />
              </div>

              <button
                disabled={busy}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-4 text-sm font-black text-slate-950 hover:bg-amber-300 disabled:opacity-60"
              >
                {busy ? <Loader2 className="animate-spin" size={18} /> : null}
                {busy ? "Creating..." : "Create Agent Login"}
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-black">Agent will get access to</h3>
              <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-600">
                <li>✓ Dashboard</li>
                <li>✓ Bookings</li>
                <li>✓ Packages</li>
                <li>✓ Hotel Demands</li>
                <li>✓ Invoices</li>
                <li>✓ Ledger</li>
                <li>✓ Payments</li>
              </ul>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}

function Panel({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-2xl bg-slate-100 p-3">{icon}</div>
        <div>
          <h2 className="font-black">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  dark,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  dark?: boolean;
}) {
  return (
    <label className="block">
      <span
        className={`mb-2 block text-sm font-bold ${
          dark ? "text-slate-300" : "text-slate-700"
        }`}
      >
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        placeholder={placeholder}
        className={`h-12 w-full rounded-2xl border px-4 text-sm font-semibold outline-none ${
          dark
            ? "border-white/10 bg-white/10 text-white placeholder:text-slate-500"
            : "border-slate-200 bg-slate-50 text-slate-950"
        }`}
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <p className="text-xs font-bold uppercase text-emerald-700">{label}</p>
      <p className="mt-1 font-black">{value || "—"}</p>
    </div>
  );
}