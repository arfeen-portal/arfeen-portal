"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BedDouble, CalendarDays, Hotel, Loader2, Save } from "lucide-react";
import Link from "next/link";

const initialForm = {
  agent_name: "",
  guest_name: "",
  city: "Makkah",
  hotel: "",
  check_in: "",
  check_out: "",
  room_type: "Quad",
  rooms: "1",
  pax: "4",
  meal_plan: "BB",
  budget: "",
  urgency: "normal",
  notes: "",
};

export default function NewOfflineHotelDemandPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitDemand() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/hotel-demands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to create hotel demand");
      }

      router.push("/hotels/offline-demands");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/hotels/offline-demands"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <section className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-2xl">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-amber-100">
              <Hotel className="h-4 w-4" />
              Offline Hotel Request
            </div>
            <h1 className="text-3xl font-black md:text-5xl">Submit Hotel Request</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300 md:text-base">
              Share guest details, preferred hotel, dates, and room requirements.
              Our operations team will review your request and send a quotation.
            </p>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-black text-slate-950">Demand Details</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Agent Name" value={form.agent_name} onChange={(v) => updateField("agent_name", v)} />
              <Input label="Guest Name" required value={form.guest_name} onChange={(v) => updateField("guest_name", v)} />

              <Select
                label="City"
                value={form.city}
                onChange={(v) => updateField("city", v)}
                options={["Makkah", "Madinah", "Jeddah", "Taif"]}
              />

              <Input label="Hotel" required value={form.hotel} onChange={(v) => updateField("hotel", v)} />

              <Input
                label="Check-in"
                type="date"
                required
                value={form.check_in}
                onChange={(v) => updateField("check_in", v)}
              />

              <Input
                label="Check-out"
                type="date"
                required
                value={form.check_out}
                onChange={(v) => updateField("check_out", v)}
              />

              <Select
                label="Room Type"
                value={form.room_type}
                onChange={(v) => updateField("room_type", v)}
                options={["Sharing", "Quad", "Triple", "Double", "Single", "Suite"]}
              />

              <Select
                label="Meal Plan"
                value={form.meal_plan}
                onChange={(v) => updateField("meal_plan", v)}
                options={["RO", "BB", "HB", "FB"]}
              />

              <Input label="Rooms" type="number" value={form.rooms} onChange={(v) => updateField("rooms", v)} />
              <Input label="Pax" type="number" value={form.pax} onChange={(v) => updateField("pax", v)} />
              <Input label="Budget SAR" type="number" value={form.budget} onChange={(v) => updateField("budget", v)} />

              <Select
                label="Urgency"
                value={form.urgency}
                onChange={(v) => updateField("urgency", v)}
                options={["normal", "high", "urgent"]}
              />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-bold text-slate-700">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white"
                  placeholder="Special request, supplier preference, guest requirement..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={submitDemand}
                disabled={saving || !form.guest_name || !form.hotel || !form.check_in || !form.check_out}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Create Demand
              </button>
            </div>
          </div>

          <aside className="space-y-4">
            {[
              {
                icon: Hotel,
                title: "What to include",
                text: "Preferred hotel, city, dates, room type, pax count, and budget if available.",
              },
              {
                icon: BedDouble,
                title: "Who can use this",
                text: "Agents and customers can submit offline hotel requests from the public portal.",
              },
              {
                icon: CalendarDays,
                title: "What happens next",
                text: "Operations reviews your request and sends a quotation or confirmation update.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 inline-flex rounded-2xl bg-amber-50 p-3">
                  <item.icon className="h-5 w-5 text-amber-700" />
                </div>
                <h3 className="font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.text}</p>
              </div>
            ))}
          </aside>
        </section>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white"
      />
    </div>
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
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:bg-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}