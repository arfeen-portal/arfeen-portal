"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  Globe2,
  Paintbrush,
  Pencil,
  Rocket,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import {
  MODULE_LABELS,
  PROVISIONING_MODULE_KEYS,
  type ProvisioningModuleKey,
} from "@/lib/tenantModules";
import {
  getDefaultFeaturesForModules,
  getFeatureByKey,
  getFeaturesForModule,
  normalizeAllowedFeatures,
  sanitizeAllowedFeaturesForModules,
} from "@/lib/tenantFeatures";

type TenantStatus =
  | "pending_approval"
  | "approved_ready"
  | "live"
  | "rejected";

type Tenant = {
  id: string;
  tenant_name: string;
  slug: string;
  status: TenantStatus | string;
  approval_status: string;
  custom_domain: string | null;
  display_domain?: string | null;
  display_domain_verified?: boolean;
  subdomain: string | null;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  contact_email: string | null;
  contact_phone: string | null;
  bio: string | null;
  plan_name: string;
  allowed_modules: string[];
  allowed_features?: string[];
  domain_verified: boolean;
  approved_at: string | null;
  go_live_at: string | null;
  created_at: string;
};

const moduleOptions: ProvisioningModuleKey[] = [...PROVISIONING_MODULE_KEYS];

const publicModuleDefaults: ProvisioningModuleKey[] = [
  "dashboard",
  "transport",
  "umrah",
  "hotels",
  "visa",
  "contact",
  "group_tickets",
  "agents",
  "accounts",
  "reports",
  "vouchers",
  "refunds",
  "airline_reports",
  "white_label",
];

const planOptions = [
  "starter",
  "professional",
  "enterprise",
  "white_label_pro",
];

const initialForm = {
  tenant_name: "",
  custom_domain: "",
  logo_url: "",
  primary_color: "#0f766e",
  secondary_color: "#111827",
  contact_email: "",
  contact_phone: "",
  bio: "",
  plan_name: "starter",
  allowed_modules: publicModuleDefaults,
};

function cleanDomain(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function tenantDisplayDomain(tenant: Tenant) {
  return (
    tenant.display_domain ||
    tenant.custom_domain ||
    (tenant.subdomain ? `${tenant.subdomain}.yourportal.com` : "No domain")
  );
}

function tenantDisplayDomainVerified(tenant: Tenant) {
  return tenant.display_domain_verified ?? tenant.domain_verified;
}

export default function TenantProvisioningPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [form, setForm] = useState(initialForm);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [editModules, setEditModules] = useState<ProvisioningModuleKey[]>([]);
  const [editFeatures, setEditFeatures] = useState<string[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function loadTenants() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/tenant-provisioning", {
        cache: "no-store",
      });

      const json = await res.json();

      if (json.ok) {
        setTenants(json.tenants || []);
      } else {
        setMessage({
          type: "error",
          text: json.error || "Failed to load tenants.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Failed to load tenants.",
      });
    } finally {
      setLoading(false);
    }
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

  function toggleModule(module: ProvisioningModuleKey) {
    setForm((prev) => ({
      ...prev,
      allowed_modules: prev.allowed_modules.includes(module)
        ? prev.allowed_modules.filter((m) => m !== module)
        : [...prev.allowed_modules, module],
    }));
  }

  function validateForm() {
    if (!form.tenant_name.trim()) {
      return "Tenant / Agency name is required.";
    }

    const domain = cleanDomain(form.custom_domain);

    if (domain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
      return "Custom domain format is invalid.";
    }

    if (
      form.contact_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)
    ) {
      return "Contact email format is invalid.";
    }

    if (!form.allowed_modules.length) {
      return "At least one module must be selected.";
    }

    return null;
  }

  async function createTenant() {
    setMessage(null);

    const validationError = validateForm();

    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...form,
        custom_domain: cleanDomain(form.custom_domain),
      };

      const res = await fetch("/api/admin/tenant-provisioning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.ok) {
        setForm(initialForm);
        setMessage({
          type: "success",
          text: "Tenant created. Now approve it, then use Go Live.",
        });
        await loadTenants();
      } else {
        setMessage({
          type: "error",
          text: json.error || "Tenant creation failed.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Tenant creation failed.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function actionTenant(
    id: string,
    action: "approve" | "reject" | "go_live"
  ) {
    setMessage(null);
    setActionLoading(`${id}:${action}`);

    try {
      const res = await fetch("/api/admin/tenant-provisioning", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          action,
          approved_by: "admin",
          rejection_reason: "Tenant setup rejected after admin review.",
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        setMessage({
          type: "error",
          text: json.error || "Action failed.",
        });
        return;
      }

      const successText =
        action === "approve"
          ? "Tenant approved. You can now click Go Live."
          : action === "go_live"
            ? "Tenant is now live."
            : "Tenant rejected.";

      setMessage({
        type: "success",
        text: successText,
      });

      await loadTenants();
    } catch {
      setMessage({
        type: "error",
        text: "Action failed.",
      });
    } finally {
      setActionLoading(null);
    }
  }

  function openEditModules(tenant: Tenant) {
    const modules = (tenant.allowed_modules || []).filter((m): m is ProvisioningModuleKey =>
      moduleOptions.includes(m as ProvisioningModuleKey)
    );

    setEditTenant(tenant);
    setEditModules(modules);
    setEditFeedback(null);
    setEditFeatures(
      tenant.allowed_features?.length
        ? normalizeAllowedFeatures(tenant.allowed_features)
        : getDefaultFeaturesForModules(modules)
    );
  }

  function closeEditModules() {
    setEditTenant(null);
    setEditModules([]);
    setEditFeatures([]);
    setEditSaving(false);
    setEditFeedback(null);
  }

  function toggleEditModule(module: ProvisioningModuleKey) {
    setEditModules((prev) => {
      const next = prev.includes(module)
        ? prev.filter((m) => m !== module)
        : [...prev, module];

      setEditFeatures((currentFeatures) => {
        if (!prev.includes(module)) {
          const moduleFeatureKeys = getFeaturesForModule(module).map((f) => f.feature_key);
          return [...new Set([...currentFeatures, ...moduleFeatureKeys])];
        }

        const moduleFeatureKeys = new Set(getFeaturesForModule(module).map((f) => f.feature_key));
        return currentFeatures.filter((key) => !moduleFeatureKeys.has(key));
      });

      return next;
    });
  }

  function toggleEditFeature(featureKey: string, moduleKey: ProvisioningModuleKey) {
    if (!editModules.includes(moduleKey)) return;

    setEditFeatures((prev) =>
      prev.includes(featureKey)
        ? prev.filter((key) => key !== featureKey)
        : [...prev, featureKey]
    );
  }

  function selectAllFeaturesForModule(moduleKey: ProvisioningModuleKey) {
    if (!editModules.includes(moduleKey)) return;

    const keys = getFeaturesForModule(moduleKey).map((f) => f.feature_key);
    setEditFeatures((prev) => [...new Set([...prev, ...keys])]);
  }

  function clearAllFeaturesForModule(moduleKey: ProvisioningModuleKey) {
    const keys = new Set(getFeaturesForModule(moduleKey).map((f) => f.feature_key));
    setEditFeatures((prev) => prev.filter((key) => !keys.has(key)));
  }

  async function saveEditModules() {
    if (!editTenant) return;

    if (!editModules.length) {
      setEditFeedback({
        type: "error",
        text: "At least one module must remain enabled.",
      });
      return;
    }

    const payload = {
      id: editTenant.id,
      action: "update_modules" as const,
      allowed_modules: editModules,
      allowed_features: sanitizeAllowedFeaturesForModules(editModules, editFeatures),
    };

    setEditSaving(true);
    setEditFeedback(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/tenant-provisioning", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        const errorText =
          json.error ||
          json.message ||
          `Save failed (${res.status} ${res.statusText || "error"})`;

        setEditFeedback({ type: "error", text: errorText });
        setMessage({ type: "error", text: errorText });
        return;
      }

      const moduleCount = Object.values(json.modules || {}).filter(Boolean).length;
      const featureCount = Object.values(json.features || {}).filter(Boolean).length;
      const successText = `${editTenant.tenant_name} saved: ${moduleCount} module(s), ${featureCount} feature(s) synced to live portal.`;

      setEditFeedback({ type: "success", text: successText });
      setMessage({ type: "success", text: successText });

      await loadTenants();
      closeEditModules();
    } catch (error) {
      const errorText =
        error instanceof Error ? error.message : "Failed to update tenant modules.";

      setEditFeedback({ type: "error", text: errorText });
      setMessage({ type: "error", text: errorText });
    } finally {
      setEditSaving(false);
    }
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
                Client website create karo, domain attach karo, modules select
                karo, approve karo aur phir Go Live karo.
              </p>
            </div>

            <div className="rounded-2xl border border-teal-300/20 bg-black/30 p-4 text-sm">
              <div className="flex items-center gap-2 text-teal-300">
                <Rocket size={18} />
                Controlled launch model
              </div>
            </div>
          </div>
        </div>

        {message ? (
          <div
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-semibold",
              message.type === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-rose-400/30 bg-rose-400/10 text-rose-200",
            ].join(" ")}
          >
            {message.text}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard
            icon={<Building2 />}
            label="Total Tenants"
            value={stats.total}
          />
          <StatCard
            icon={<Clock />}
            label="Pending Approval"
            value={stats.pending}
          />
          <StatCard
            icon={<ShieldCheck />}
            label="Approved Ready"
            value={stats.approved}
          />
          <StatCard
            icon={<Globe2 />}
            label="Live Domains"
            value={stats.live}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 lg:col-span-1">
            <h2 className="text-xl font-bold">Create Tenant</h2>
            <p className="mt-1 text-sm text-slate-400">
              Pehle pending approval me jayega. Backend/sidebar public domain
              par nahi jayega.
            </p>

            <div className="mt-5 space-y-4">
              <Input
                label="Tenant / Agency Name"
                value={form.tenant_name}
                onChange={(v) => setForm({ ...form, tenant_name: v })}
                placeholder="Example: Arfeen Portal"
              />

              <Input
                label="Custom Domain"
                value={form.custom_domain}
                onChange={(v) => setForm({ ...form, custom_domain: v })}
                placeholder="arfeenportal.com"
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
                <label className="text-sm font-medium text-slate-300">
                  Plan
                </label>
                <select
                  value={form.plan_name}
                  onChange={(e) =>
                    setForm({ ...form, plan_name: e.target.value })
                  }
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
                <label className="text-sm font-medium text-slate-300">
                  Agency Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none focus:border-teal-400"
                  placeholder="Short agency intro..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">
                  Allowed Modules
                </label>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {moduleOptions.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleModule(m)}
                      title={MODULE_LABELS[m]}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                        form.allowed_modules.includes(m)
                          ? "border-teal-400 bg-teal-400/15 text-teal-200"
                          : "border-white/10 bg-slate-900 text-slate-400"
                      }`}
                    >
                      {MODULE_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={createTenant}
                disabled={saving || !form.tenant_name.trim()}
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
                  Flow: Pending → Approve → Go Live.
                </p>
              </div>

              <Paintbrush className="text-teal-300" />
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-[950px] text-left text-sm">
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
                      <td
                        className="px-4 py-8 text-center text-slate-400"
                        colSpan={6}
                      >
                        Loading tenants...
                      </td>
                    </tr>
                  ) : tenants.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-8 text-center text-slate-400"
                        colSpan={6}
                      >
                        No tenant created yet.
                      </td>
                    </tr>
                  ) : (
                    tenants.map((tenant) => (
                      <tr key={tenant.id} className="bg-slate-950/30">
                        <td className="px-4 py-4">
                          <div className="font-bold">
                            {tenant.tenant_name}
                          </div>
                          <div className="text-xs text-slate-400">
                            /{tenant.slug} ·{" "}
                            {tenant.contact_phone || "No phone"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-slate-200">
                            {tenantDisplayDomain(tenant)}
                          </div>
                          <div className="text-xs text-slate-500">
                            {tenantDisplayDomainVerified(tenant)
                              ? "Verified"
                              : "Not verified"}
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
                          <TenantActions
                            tenant={tenant}
                            actionLoading={actionLoading}
                            onAction={actionTenant}
                            onEditModules={openEditModules}
                          />
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

      {editTenant ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-teal-300">
                  Edit Modules & Features
                </p>
                <h3 className="mt-2 text-xl font-bold text-white">
                  {editTenant.tenant_name}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {tenantDisplayDomain(editTenant)} · {editTenant.status}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModules}
                className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-4 text-sm text-slate-400">
              Enable main modules, then choose sidebar sub-features per module. Changes
              sync to live portal module and feature flags for this domain.
            </p>

            {editFeedback ? (
              <div
                className={[
                  "mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold",
                  editFeedback.type === "success"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                    : "border-rose-400/30 bg-rose-400/10 text-rose-200",
                ].join(" ")}
              >
                {editFeedback.text}
              </div>
            ) : null}

            <div className="mt-5 space-y-4">
              {moduleOptions.map((moduleKey) => {
                const moduleEnabled = editModules.includes(moduleKey);
                const moduleFeatures = getFeaturesForModule(moduleKey);

                return (
                  <div
                    key={moduleKey}
                    className={`rounded-2xl border p-4 ${
                      moduleEnabled
                        ? "border-teal-400/30 bg-teal-400/5"
                        : "border-white/10 bg-slate-950/50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleEditModule(moduleKey)}
                        className="text-left"
                      >
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">
                          {moduleKey}
                        </p>
                        <p className="text-sm font-bold text-white">
                          {MODULE_LABELS[moduleKey]}
                        </p>
                      </button>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            moduleEnabled
                              ? "bg-teal-400/20 text-teal-200"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {moduleEnabled ? "Enabled" : "Disabled"}
                        </span>
                        {moduleEnabled && moduleFeatures.length > 0 ? (
                          <>
                            <button
                              type="button"
                              onClick={() => selectAllFeaturesForModule(moduleKey)}
                              className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/5"
                            >
                              Select all
                            </button>
                            <button
                              type="button"
                              onClick={() => clearAllFeaturesForModule(moduleKey)}
                              className="rounded-lg border border-white/10 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-white/5"
                            >
                              Clear all
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {moduleEnabled && moduleFeatures.length > 0 ? (
                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {moduleFeatures.map((feature) => {
                          const selected = editFeatures.includes(feature.feature_key);

                          return (
                            <label
                              key={feature.feature_key}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-sm ${
                                selected
                                  ? "border-indigo-400/30 bg-indigo-400/10 text-indigo-100"
                                  : "border-white/10 bg-slate-950 text-slate-400"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() =>
                                  toggleEditFeature(feature.feature_key, moduleKey)
                                }
                                className="mt-1"
                              />
                              <span>
                                <span className="block font-semibold">{feature.label}</span>
                                <span className="block text-[11px] text-slate-500">
                                  {feature.feature_key}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeEditModules}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditModules}
                disabled={editSaving || editModules.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-400 disabled:opacity-50"
              >
                <Pencil size={14} />
                {editSaving ? "Saving..." : "Save Modules & Features"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function TenantActions({
  tenant,
  actionLoading,
  onAction,
  onEditModules,
}: {
  tenant: Tenant;
  actionLoading: string | null;
  onAction: (
    id: string,
    action: "approve" | "reject" | "go_live"
  ) => Promise<void>;
  onEditModules: (tenant: Tenant) => void;
}) {
  const isBusy = (action: string) => actionLoading === `${tenant.id}:${action}`;

  const editButton =
    tenant.status !== "rejected" ? (
      <button
        type="button"
        onClick={() => onEditModules(tenant)}
        className="inline-flex items-center gap-1 rounded-lg border border-indigo-400/30 px-3 py-2 text-xs font-bold text-indigo-200 hover:bg-indigo-400/10"
      >
        <Pencil size={12} />
        Edit Modules
      </button>
    ) : null;

  if (tenant.status === "pending_approval") {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {editButton}
        <button
          onClick={() => onAction(tenant.id, "approve")}
          disabled={isBusy("approve")}
          className="rounded-lg border border-emerald-400/30 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50"
        >
          {isBusy("approve") ? "Approving..." : "Approve"}
        </button>

        <button
          onClick={() => onAction(tenant.id, "reject")}
          disabled={isBusy("reject")}
          className="rounded-lg border border-rose-400/30 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-400/10 disabled:opacity-50"
        >
          {isBusy("reject") ? "Rejecting..." : "Reject"}
        </button>
      </div>
    );
  }

  if (tenant.status === "approved_ready") {
    return (
      <div className="flex flex-wrap justify-end gap-2">
        {editButton}
        <button
          onClick={() => onAction(tenant.id, "go_live")}
          disabled={isBusy("go_live")}
          className="rounded-lg border border-teal-400/30 px-3 py-2 text-xs font-bold text-teal-300 hover:bg-teal-400/10 disabled:opacity-50"
        >
          {isBusy("go_live") ? "Going Live..." : "Go Live"}
        </button>

        <button
          onClick={() => onAction(tenant.id, "reject")}
          disabled={isBusy("reject")}
          className="rounded-lg border border-rose-400/30 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-400/10 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    );
  }

  if (tenant.status === "live") {
    return (
      <div className="flex flex-col items-end gap-2">
        {editButton}
        <div className="text-xs font-semibold text-emerald-300">
          Live customer website
        </div>
      </div>
    );
  }

  return (
    <div className="text-right text-xs font-semibold text-rose-300">
      Rejected
    </div>
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
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${config.className}`}
    >
      {config.icon}
      {config.text}
    </span>
  );
}