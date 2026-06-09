"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Brain, Building2, Globe2, Palette, Rocket, ShieldCheck } from "lucide-react";

type SaaSRequest = {
  id: string;
  agency_name: string;
  owner_name: string;
  domain: string;
  plan: string;
  progress: number;
  status: string;
};

export default function SaaSOnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<SaaSRequest[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/ai/saas-onboarding", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load SaaS onboarding");
        const json = await res.json();
        setRequests(Array.isArray(json?.requests) ? json.requests : []);
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#050816] p-6 text-white">
      <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-purple-950 via-slate-950 to-fuchsia-950 p-7 shadow-2xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-400/10 px-4 py-2 text-sm text-purple-200">
              <Rocket className="h-4 w-4" />
              AI Tenant Setup Layer
            </div>
            <h1 className="text-4xl font-black">SaaS Onboarding</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              AI tenant setup, brand generator, domain guidance, module
              recommendation, fraud detection, training, and go-live approval.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Active Requests</p>
            <h2 className="text-4xl font-black text-purple-200">
              {requests.length}
            </h2>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-red-100">
            {error}
          </div>
        )}

        <div className="mb-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Feature icon={<Brain />} title="AI Setup Assistant" text="Auto module suggestions." />
          <Feature icon={<Palette />} title="Brand Generator" text="Logo, theme, invoice style." />
          <Feature icon={<Globe2 />} title="Domain Assistant" text="DNS and domain readiness." />
          <Feature icon={<ShieldCheck />} title="Approval Gate" text="Review before go-live." />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-5 text-xl font-bold">Onboarding Requests</h2>

          {loading ? (
            <p className="text-sm text-slate-400">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-400">No SaaS onboarding requests yet.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-300">
                  <tr>
                    <th className="p-4">Agency</th>
                    <th className="p-4">Owner</th>
                    <th className="p-4">Domain</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Progress</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((item) => (
                    <tr key={item.id} className="border-t border-white/10">
                      <td className="p-4 font-bold">{item.agency_name}</td>
                      <td className="p-4 text-slate-300">{item.owner_name}</td>
                      <td className="p-4 text-cyan-200">{item.domain}</td>
                      <td className="p-4">{item.plan}</td>
                      <td className="p-4">{item.progress}%</td>
                      <td className="p-4">
                        <span className="rounded-full bg-purple-400/10 px-3 py-1 text-xs text-purple-200">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
      <div className="mb-3 inline-flex rounded-2xl bg-purple-400/10 p-3 text-purple-200">
        {icon}
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}