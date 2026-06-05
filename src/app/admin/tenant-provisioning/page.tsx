"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Globe2,
  Paintbrush,
  Rocket,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type Tenant = {
  id: string;
  tenant_name: string;
  slug: string;
  status: string;
  approval_status: string;
  custom_domain: string | null;
  subdomain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  contact_email: string | null;
  contact_phone: string | null;
  bio: string | null;
  plan_name: string;
  allowed_modules: string[];
  domain_verified: boolean;
  approved_at: string | null;
  go_live_at: string | null;
  created_at: string;
};

const moduleOptions = [
  "dashboard",
  "accounts",
  "transport",
  "umrah",
  "agents",
  "reports",
  "hotels",
  "vouchers",
  "refunds",
  "airline_reports",
  "ai_tools",
  "white_label",
];

const planOptions = ["starter", "professional", "enterprise", "white_label_pro"];

export default function TenantProvisioningPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    tenant_name: "",
    custom_domain: "",
    logo_url: "",
    primary_color: "#0f766e",
    secondary_color: "#111827",
    contact_email: "",
    contact_phone: "",
    bio: "",
    plan_name: "starter",
    allowed_modules: ["dashboard", "accounts", "transport", "umrah", "agents", "reports"],
  });

  async function loadTenants() {
    setLoading(true);
    const res = await fetch("/api/admin/tenant-provisioning", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setTenants(json.tenants || []);
    setLoading(false);
  }

  useEffect(() => {
    loadTenants();
  }, []);

  const stats = useMemo(() => {
    return {
      total: tenants.length,
      pending: tenants.filter((t) => t.status === "pending_approval").length,
      approved: tenants.filter((t) => t.status === "approved_ready").length,
      live: tenants.filter((t) => t.status === "live").length,
    };
  }, [tenants]);

  function toggleModule(module: string) {
    setForm((prev) => ({
      ...prev,
      allowed_modules: prev.allowed_modules.includes(module)
        ? prev.allowed_modules.filter((m) => m !== module)
        : [...prev.allowed_modules, module],
    }));
  }

  async function createTenant() {
    setSaving(true);

    const res = await fetch("/api/admin/tenant-provisioning", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (json.ok) {
      setForm({
        tenant_name: "",
        custom_domain: "",
        logo_url: "",
        primary_color: "#0f766e",
        secondary_color: "#111827",
        contact_email: "",
        contact_phone: "",
        bio: "",
        plan_name: "starter",
        allowed_modules: ["dashboard", "accounts", "transport", "umrah", "agents", "reports"],
      });
      await loadTenants();
    } else {
      alert(json.error || "Tenant creation failed.");
    }

    setSaving(false);
  }

  async function actionTenant(id: string, action: "approve" | "reject" | "go_live") {
    const res = await fetch("/api/admin/tenant-provisioning", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        action,
        approved_by: "admin",
        rejection_reason: "Tenant setup rejected after admin review.",
      }),
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error || "Action failed.");
      return;
    }

    await loadTenants();
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-teal-500/20 via-slate-900 to-slate-950 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-300">
                White Label SaaS Control
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                Tenant Provisioning Engine
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                New agent portal create karo, admin approval do, custom domain attach karo,
                theme select karo, modules enable karo aur approval ke baad portal live karo.
              </p>
            </div>

            <div className="rounded-2xl border border-teal-300/20 bg-black/30 p-4 text-sm">
              <div className="flex items-center gap-2 text-teal-300">
                <Rocket size={18} />
                One-click approved launch model
              </div>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard icon={<Building2 />} label="Total Tenants" value={stats.total} />
          <StatCard icon={<Clock />} label="Pending Approval" value={stats.pending} />
          <StatCard icon={<ShieldCheck />} label="Approved Ready" value={stats.approved} />
          <StatCard icon={<Globe2 />} label="Live Domains" value={stats.live} />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 lg:col-span-1">
            <h2 className="text-xl font-bold">Create Tenant</h2>
            <p className="mt-1 text-sm text-slate-400">
              Ye tenant pehle pending approval me jayega.
            </p>

            <div className="mt-5 space-y-4">
              <Input
                label="Tenant / Agency Name"
                value={form.tenant_name}
                onChange={(v) => setForm({ ...form, tenant_name: v })}
                placeholder="Example: ABC Umrah Services"
              />

              <Input
                label="Custom Domain"
                value={form.custom_domain}
                onChange={(v) => setForm({ ...form, custom_domain: v })}
                placeholder="portal.agentdomain.com"
              />

              <Input
                label="Logo URL"
                value={form.logo_url}
                onChange={(v) => setForm({ ...form, logo_url: v })}
                placeholder="https://..."
              />

              <Input
                label="Contact Email"
                value={form.contact_email}
                onChange={(v) => setForm({ ...form, contact_email: v })}
                placeholder="admin@example.com"
              />

              <Input
                label="Contact Phone"
                value={form.contact_phone}
                onChange={(v) => setForm({ ...form, contact_phone: v })}
                placeholder="+92..."
              />

              <div>
                <label className="text-sm font-medium text-slate-300">Plan</label>
                <select
                  value={form.plan_name}
                  onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none focus:border-teal-400"
                >
                  {planOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Primary"
                  value={form.primary_color}
                  onChange={(v) => setForm({ ...form, primary_color: v })}
                  placeholder="#0f766e"
                />
                <Input
                  label="Secondary"
                  value={form.secondary_color}
                  onChange={(v) => setForm({ ...form, secondary_color: v })}
                  placeholder="#111827"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">Agency Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none focus:border-teal-400"
                  placeholder="Short agency intro..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">Allowed Modules</label>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {moduleOptions.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleModule(m)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                        form.allowed_modules.includes(m)
                          ? "border-teal-400 bg-teal-400/15 text-teal-200"
                          : "border-white/10 bg-slate-900 text-slate-400"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={createTenant}
                disabled={saving || !form.tenant_name}
                className="w-full rounded-xl bg-teal-500 px-4 py-3 font-bold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Tenant For Approval"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Tenant Approval Queue</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Approve ke baad hi live button use karo.
                </p>
              </div>
              <Paintbrush className="text-teal-300" />
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Tenant</th>
                    <th className="px-4 py-3">Domain</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Modules</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {loading ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-400" colSpan={6}>
                        Loading tenants...
                      </td>
                    </tr>
                  ) : tenants.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-400" colSpan={6}>
                        No tenant created yet.
                      </td>
                    </tr>
                  ) : (
                    tenants.map((tenant) => (
                      <tr key={tenant.id} className="bg-slate-950/30">
                        <td className="px-4 py-4">
                          <div className="font-bold">{tenant.tenant_name}</div>
                          <div className="text-xs text-slate-400">
                            /{tenant.slug} · {tenant.contact_phone || "No phone"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-slate-200">
                            {tenant.custom_domain || `${tenant.subdomain}.yourportal.com`}
                          </div>
                          <div className="text-xs text-slate-500">
                            {tenant.domain_verified ? "Verified" : "Not verified"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                            {tenant.plan_name}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="max-w-xs truncate text-xs text-slate-300">
                            {(tenant.allowed_modules || []).join(", ")}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <StatusBadge status={tenant.status} />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => actionTenant(tenant.id, "approve")}
                              className="rounded-lg border border-emerald-400/30 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/10"
                            >
                              Approve
                            </button>

                            <button
                              onClick={() => actionTenant(tenant.id, "go_live")}
                              className="rounded-lg border border-teal-400/30 px-3 py-2 text-xs font-bold text-teal-300 hover:bg-teal-400/10"
                            >
                              Go Live
                            </button>

                            <button
                              onClick={() => actionTenant(tenant.id, "reject")}
                              className="rounded-lg border border-rose-400/30 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-400/10"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between">
        <div className="text-slate-400">{label}</div>
        <div className="text-teal-300">{icon}</div>
      </div>
      <div className="mt-3 text-3xl font-black">{value}</div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none focus:border-teal-400"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config =
    status === "live"
      ? {
          icon: <CheckCircle2 size={14} />,
          text: "Live",
          className: "bg-emerald-400/10 text-emerald-300",
        }
      : status === "approved_ready"
      ? {
          icon: <ShieldCheck size={14} />,
          text: "Approved",
          className: "bg-teal-400/10 text-teal-300",
        }
      : status === "rejected"
      ? {
          icon: <XCircle size={14} />,
          text: "Rejected",
          className: "bg-rose-400/10 text-rose-300",
        }
      : {
          icon: <Clock size={14} />,
          text: "Pending",
          className: "bg-amber-400/10 text-amber-300",
        };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${config.className}`}>
      {config.icon}
      {config.text}
    </span>
  );
}