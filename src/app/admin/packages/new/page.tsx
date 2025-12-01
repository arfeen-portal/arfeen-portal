"use client";

import { useState } from "react";

type PackageForm = {
  agent_id: string;
  package_code: string;
  passengers: number;
  start_date: string;
};

export default function NewPackageBookingPage() {
  const [form, setForm] = useState<PackageForm>({
    agent_id: "",
    package_code: "",
    passengers: 1,
    start_date: "",
  });

  function handleChange(field: keyof PackageForm, value: string) {
    if (field === "passengers") {
      setForm((prev) => ({
        ...prev,
        passengers: Number(value || "0"),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Package booking (demo only):", form);
    alert("Demo only – form console mein print ho gaya.");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl px-4 py-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h1 className="text-lg font-semibold text-slate-900">
            New Umrah Package Booking (Demo)
          </h1>
          <p className="text-[11px] text-slate-500">
            Abhi yeh sirf UI form hai – baad mein isko Supabase booking table se
            connect karenge.
          </p>

          <div className="space-y-1 text-sm">
            <label className="text-xs font-medium text-slate-700">
              Agent ID
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-slate-400"
              value={form.agent_id}
              onChange={(e) => handleChange("agent_id", e.target.value)}
              placeholder="AG-001"
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="text-xs font-medium text-slate-700">
              Package Code
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-slate-400"
              value={form.package_code}
              onChange={(e) => handleChange("package_code", e.target.value)}
              placeholder="20N-PREM-12-8"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1 text-sm">
              <label className="text-xs font-medium text-slate-700">
                Passengers
              </label>
              <input
                type="number"
                min={1}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-slate-400"
                value={form.passengers}
                onChange={(e) => handleChange("passengers", e.target.value)}
              />
            </div>

            <div className="space-y-1 text-sm">
              <label className="text-xs font-medium text-slate-700">
                Start Date
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-slate-400"
                value={form.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Save (demo)
          </button>
        </form>
      </div>
    </main>
  );
}
