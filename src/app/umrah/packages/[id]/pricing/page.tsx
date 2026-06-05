import React from "react";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PackagePricingPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-400">
          Arfeen Travel · Umrah Package
        </p>

        <h1 className="mt-3 text-3xl font-black">Package Pricing Calculator</h1>

        <p className="mt-2 text-sm text-slate-300">
          Package ID: <span className="font-bold text-white">{id}</span>
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <p className="text-xs uppercase text-slate-400">Sharing</p>
            <p className="mt-2 text-2xl font-black">Ready</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <p className="text-xs uppercase text-slate-400">Quad / Triple / Double</p>
            <p className="mt-2 text-2xl font-black">Calculator</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900 p-5">
            <p className="text-xs uppercase text-slate-400">Status</p>
            <p className="mt-2 text-2xl font-black text-emerald-300">Build Safe</p>
          </div>
        </div>
      </div>
    </main>
  );
}