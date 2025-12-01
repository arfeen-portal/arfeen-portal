"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type RoomType = "sharing" | "quad" | "triple" | "double";
type LeadPriority = "low" | "medium" | "high";

interface SimplePackage {
  id: string;
  code: string;
  origin_city: string;
  date_range: string;
}

interface FormState {
  package_id: string;
  room_type: RoomType;
  full_name: string;
  phone: string;
  email: string;
  passengers: number;
  notes: string;
  source: string;
  tracking_opt_in: boolean;
  addons: string[];
}

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  sharing: "Sharing",
  quad: "Quad",
  triple: "Triple",
  double: "Double",
};

const ADDONS = [
  {
    code: "airport_pickup",
    label: "Airport pickup (JED / MED)",
    hint: "Private car with driver from airport to hotel",
  },
  {
    code: "makkah_ziyarat",
    label: "Makkah Ziyarat tour",
    hint: "Half-day ziyarat of historical places in Makkah",
  },
  {
    code: "madinah_ziyarat",
    label: "Madinah Ziyarat tour",
    hint: "Half-day ziyarat of historical places in Madinah",
  },
  {
    code: "full_transport",
    label: "Full transport package",
    hint: "Airport ⇄ hotel + Makkah ⇄ Madinah transfers",
  },
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function computeLeadScore(params: {
  room_type: RoomType;
  passengers: number;
  source: string;
  hasEmail: boolean;
  notesLength: number;
}): { score: number; priority: LeadPriority } {
  let score = 0;

  if (params.room_type === "double") score += 25;
  if (params.room_type === "triple") score += 18;
  if (params.room_type === "quad") score += 10;
  if (params.room_type === "sharing") score += 5;

  if (params.passengers >= 5) score += 25;
  else if (params.passengers >= 3) score += 15;
  else if (params.passengers === 2) score += 8;
  else score += 5;

  const src = (params.source || "").toLowerCase();
  if (src === "agent" || src === "b2b agent") score += 25;
  else if (src === "repeat-customer") score += 20;
  else if (src === "website" || src === "google") score += 10;
  else score += 5;

  if (params.hasEmail) score += 5;

  if (params.notesLength > 80) score += 10;
  else if (params.notesLength > 20) score += 5;

  if (score > 100) score = 100;

  let priority: LeadPriority = "low";
  if (score >= 70) priority = "high";
  else if (score >= 40) priority = "medium";

  return { score, priority };
}

export default function UmrahBookingPage() {
  const [packages, setPackages] = useState<SimplePackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    package_id: "",
    room_type: "sharing",
    full_name: "",
    phone: "",
    email: "",
    passengers: 1,
    notes: "",
    source: "website",
    tracking_opt_in: true, // B2C public form -> default ON
    addons: [],
  });

  useEffect(() => {
    const loadPackages = async () => {
      const { data, error } = await supabase
        .from("umrah_packages")
        .select("id, code, origin_city, date_range")
        .order("code", { ascending: true });

      if (!error && data) {
        setPackages(
          data.map((p: any) => ({
            id: p.id,
            code: p.code,
            origin_city: p.origin_city,
            date_range: p.date_range,
          }))
        );
      }
      setLoadingPackages(false);
    };

    loadPackages();
  }, []);

  const handleChange = (
    field: keyof FormState,
    value: string | number | RoomType | boolean | string[]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value } as FormState));
  };

  const toggleAddon = (code: string) => {
    setForm((prev) => {
      const exists = prev.addons.includes(code);
      const addons = exists
        ? prev.addons.filter((c) => c !== code)
        : [...prev.addons, code];
      return { ...prev, addons };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!form.package_id) {
      setError("Please select a package.");
      return;
    }
    if (!form.full_name || !form.phone) {
      setError("Name and phone are required.");
      return;
    }
    if (form.passengers < 1) {
      setError("Passengers must be at least 1.");
      return;
    }

    const { score, priority } = computeLeadScore({
      room_type: form.room_type,
      passengers: form.passengers,
      source: form.source,
      hasEmail: !!form.email,
      notesLength: form.notes.trim().length,
    });

    const selectedAddons = ADDONS.filter((a) =>
      form.addons.includes(a.code)
    );
    const addonsSummary =
      selectedAddons.length > 0
        ? selectedAddons.map((a) => a.label).join(", ")
        : null;

    setSubmitting(true);

    // 1) insert booking and get ID
    const { data, error } = await supabase
      .from("umrah_bookings")
      .insert({
        package_id: form.package_id,
        room_type: form.room_type,
        full_name: form.full_name,
        phone: form.phone,
        email: form.email || null,
        passengers: form.passengers,
        notes: form.notes || null,
        source: form.source || null,
        lead_score: score,
        priority,
        tracking_enabled: form.tracking_opt_in,
        addons_summary: addonsSummary,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error(error);
      setError("Booking could not be saved. Please try again.");
      setSubmitting(false);
      return;
    }

    const bookingId = data.id as string;

    // 2) insert addons in separate table
    if (selectedAddons.length > 0) {
      const addonRows = selectedAddons.map((a) => ({
        booking_id: bookingId,
        addon_code: a.code,
        addon_label: a.label,
        quantity: 1,
      }));
      const { error: addonError } = await supabase
        .from("umrah_booking_addons")
        .insert(addonRows);
      if (addonError) {
        console.error(addonError);
        // booking saved ho chuka, is liye sirf console error
      }
    }

    setMessage(
      "Booking submitted successfully! Arfeen Travel team will contact you shortly."
    );
    setForm({
      package_id: "",
      room_type: "sharing",
      full_name: "",
      phone: "",
      email: "",
      passengers: 1,
      notes: "",
      source: "website",
      tracking_opt_in: true,
      addons: [],
    });
    setSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-slate-100 pb-12">
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Umrah Booking Form
          </h1>
          <p className="mt-1 text-xs md:text-sm text-slate-500">
            Select any Umrah package and send your booking request. Arfeen
            Travel &amp; Tours team will confirm details on WhatsApp / phone.
          </p>
        </header>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          {loadingPackages ? (
            <div className="text-sm text-slate-500">Loading packages…</div>
          ) : packages.length === 0 ? (
            <div className="text-sm text-slate-500">
              No packages found. Please add packages in Supabase first.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Package select */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Select Package
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  value={form.package_id}
                  onChange={(e) =>
                    handleChange("package_id", e.target.value)
                  }
                >
                  <option value="">Choose a package…</option>
                  {packages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} · {p.origin_city} · {p.date_range}
                    </option>
                  ))}
                </select>
              </div>

              {/* Room type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Room Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ROOM_TYPE_LABELS) as RoomType[]).map(
                    (rt) => (
                      <button
                        key={rt}
                        type="button"
                        onClick={() => handleChange("room_type", rt)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          form.room_type === rt
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-400"
                        }`}
                      >
                        {ROOM_TYPE_LABELS[rt]}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Name + phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    value={form.full_name}
                    onChange={(e) =>
                      handleChange("full_name", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </div>

              {/* Email + passengers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    No. of Passengers
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                    value={form.passengers}
                    onChange={(e) =>
                      handleChange("passengers", Number(e.target.value))
                    }
                  />
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  How did you hear about us?
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  value={form.source}
                  onChange={(e) => handleChange("source", e.target.value)}
                >
                  <option value="website">Website / Google</option>
                  <option value="facebook">Facebook / Instagram</option>
                  <option value="agent">B2B Agent</option>
                  <option value="repeat-customer">
                    Previous customer / referral
                  </option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Upsell Addons */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="text-xs font-semibold text-emerald-800">
                    Recommended add-ons (optional)
                  </h2>
                  <span className="text-[10px] text-emerald-700">
                    You can add transport & ziyarat services
                  </span>
                </div>
                <div className="space-y-2">
                  {ADDONS.map((a) => {
                    const checked = form.addons.includes(a.code);
                    return (
                      <label
                        key={a.code}
                        className="flex items-start gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs shadow-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          checked={checked}
                          onChange={() => toggleAddon(a.code)}
                        />
                        <div>
                          <div className="font-semibold text-slate-800">
                            {a.label}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {a.hint}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Tracking Opt-in */}
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-2 flex items-start gap-3">
                <input
                  id="tracking_opt_in"
                  type="checkbox"
                  className="mt-1"
                  checked={form.tracking_opt_in}
                  onChange={(e) =>
                    handleChange("tracking_opt_in", e.target.checked)
                  }
                />
                <label
                  htmlFor="tracking_opt_in"
                  className="flex-1 text-xs text-slate-700"
                >
                  <span className="font-semibold text-sky-800">
                    Enable family live tracking & trip timeline (recommended)
                  </span>
                  <br />
                  <span className="text-[10px] text-slate-500">
                    Your family can see basic trip status (arrival, hotel,
                    ziyarats) inside Arfeen app. Only for direct B2C bookings
                    – agent bookings are not tracked to protect their privacy.
                  </span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Special Notes (optional)
                </label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  rows={3}
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Preferred dates, family details, wheelchair, separate room, etc."
                />
              </div>

              {/* Messages */}
              {error && (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {message}
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-emerald-600 px-6 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? "Submitting…" : "Submit Booking"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
