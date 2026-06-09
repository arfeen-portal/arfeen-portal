"use client";

import { useEffect, useMemo, useState } from "react";

type ImportRow = {
  id: string;
  title: string;
  source_file_url: string;
  status: string;
  confidence_score: number;
  duplicate_warning: boolean;
  total_seats: number;
  remaining_seats: number;
  created_at: string;
};

type PackageItem = {
  id?: string;
  package_no?: string;
  departure_city?: string;
  arrival_city?: string;
  airline?: string;
  flight_no_departure?: string;
  flight_no_return?: string;
  departure_date?: string;
  return_date?: string;
  days?: number;
  nights?: number;
  makkah_nights?: number;
  madinah_nights?: number;
  makkah_hotel?: string;
  makkah_distance?: string;
  madinah_hotel?: string;
  madinah_distance?: string;
  sharing_rate?: number;
  quad_rate?: number;
  triple_rate?: number;
  double_rate?: number;
  baggage?: string;
  pnr?: string;
  group_code?: string;
  available_seats?: number;
};

export default function AiPackageImportPage() {
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [selected, setSelected] = useState<ImportRow | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("AI Imported Umrah Package");
  const [totalSeats, setTotalSeats] = useState(0);
  const [items, setItems] = useState<PackageItem[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadImports() {
    const res = await fetch("/api/umrah/ai-package-import", { cache: "no-store" });
    const json = await res.json();
    setImports(json.imports || []);
  }

  useEffect(() => {
    loadImports();
  }, []);

  const summary = useMemo(() => {
    const live = imports.filter((x) => x.status === "published").length;
    const extracted = imports.filter((x) => x.status === "extracted").length;
    const uploaded = imports.filter((x) => x.status === "uploaded").length;
    return { live, extracted, uploaded };
  }, [imports]);

  async function uploadPoster() {
    if (!file) {
      setMessage("Please select poster image first.");
      return;
    }

    setLoading(true);
    setMessage("");

    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    form.append("total_seats", String(totalSeats));

    const res = await fetch("/api/umrah/ai-package-import", {
      method: "POST",
      body: form,
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(json.error || "Upload failed");
      return;
    }

    setSelected(json.import);
    setMessage("Poster uploaded. Now run AI extraction.");
    await loadImports();
  }

  async function extractPackage() {
    if (!selected) return;

    setLoading(true);
    setMessage("AI is reading poster...");

    const res = await fetch(`/api/umrah/ai-package-import/${selected.id}/extract`, {
      method: "POST",
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(json.error || "AI extraction failed");
      return;
    }

    const extractedItems = json.extracted?.packages || [];
    setItems(extractedItems);
    setSelected(json.import);
    setMessage("AI extraction completed. Review and edit package before publishing.");
    await loadImports();
  }

  function updateItem(index: number, field: keyof PackageItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]:
                field.includes("rate") ||
                field === "available_seats" ||
                field === "days" ||
                field === "nights" ||
                field === "makkah_nights" ||
                field === "madinah_nights"
                  ? Number(value || 0)
                  : value,
            }
          : item
      )
    );
  }

  function addManualItem() {
    setItems((prev) => [
      ...prev,
      {
        package_no: String(prev.length + 1),
        departure_city: "LHE",
        arrival_city: "JED",
        airline: "",
        sharing_rate: 0,
        quad_rate: 0,
        triple_rate: 0,
        double_rate: 0,
        available_seats: totalSeats,
      },
    ]);
  }

  async function publishPackage() {
    if (!selected) return;
    if (!items.length) {
      setMessage("No package item available to publish.");
      return;
    }

    setLoading(true);
    setMessage("");

    const res = await fetch("/api/umrah/packages/publish-from-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        import_id: selected.id,
        supplier_id: supplierId || null,
        total_seats: totalSeats,
        items,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(json.error || "Publish failed");
      return;
    }

    setMessage("Package published successfully and inventory created.");
    await loadImports();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 p-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 p-8 shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
                Arfeen Travel AI Engine
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight">
                AI Package Poster Import
              </h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Poster upload karein, AI flight, hotels, rates, nights, city aur package details extract karega.
                Review/edit ke baad one-click live publish ho jayega.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-3xl font-black">{summary.uploaded}</div>
                <div className="text-xs text-slate-300">Uploaded</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-3xl font-black">{summary.extracted}</div>
                <div className="text-xs text-slate-300">Extracted</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <div className="text-3xl font-black">{summary.live}</div>
                <div className="text-xs text-slate-300">Live</div>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-1">
            <h2 className="text-xl font-bold">1. Upload Package Poster</h2>

            <div className="mt-5 space-y-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900 p-3 outline-none"
                placeholder="Package title"
              />

              <input
                type="number"
                value={totalSeats}
                onChange={(e) => setTotalSeats(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-slate-900 p-3 outline-none"
                placeholder="Total seats"
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-dashed border-white/20 bg-slate-900 p-4 text-sm"
              />

              <button
                onClick={uploadPoster}
                disabled={loading}
                className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                Upload Poster
              </button>

              <button
                onClick={extractPackage}
                disabled={!selected || loading}
                className="w-full rounded-xl bg-blue-500 px-5 py-3 font-bold text-white hover:bg-blue-400 disabled:opacity-50"
              >
                Run AI Extraction
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-2">
            <h2 className="text-xl font-bold">Recent Imports</h2>

            <div className="mt-5 max-h-[430px] space-y-3 overflow-auto pr-2">
              {imports.map((row) => (
                <button
                  key={row.id}
                  onClick={() => {
                    setSelected(row);
                    setItems([]);
                    setMessage("Selected import. Run extraction or review existing data.");
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selected?.id === row.id
                      ? "border-emerald-400 bg-emerald-400/10"
                      : "border-white/10 bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold">{row.title}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(row.created_at).toLocaleString()}
                      </div>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase">
                      {row.status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-blue-500/20 px-3 py-1">
                      Confidence: {Math.round(Number(row.confidence_score || 0) * 100)}%
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1">
                      Seats: {row.remaining_seats || row.total_seats || 0}
                    </span>
                    {row.duplicate_warning && (
                      <span className="rounded-full bg-red-500/20 px-3 py-1 text-red-200">
                        Duplicate Warning
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selected?.source_file_url && (
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-2">
              <h2 className="text-xl font-bold">Original Poster</h2>
              <img
                src={selected.source_file_url}
                alt="Package poster"
                className="mt-5 max-h-[760px] w-full rounded-2xl object-contain"
              />
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold">2. Review / Edit Extracted Packages</h2>
                <button
                  onClick={addManualItem}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20"
                >
                  + Add Row
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <input
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-900 p-3 outline-none"
                  placeholder="Supplier ID / Vendor ID"
                />

                <input
                  type="number"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(Number(e.target.value))}
                  className="rounded-xl border border-white/10 bg-slate-900 p-3 outline-none"
                  placeholder="Default total seats"
                />
              </div>

              <div className="mt-6 space-y-6">
                {items.map((item, index) => (
                  <div key={index} className="rounded-2xl border border-white/10 bg-slate-900 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-lg font-black">Package #{item.package_no || index + 1}</div>
                      <button
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                        className="rounded-lg bg-red-500/20 px-3 py-1 text-sm text-red-200"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        ["package_no", "Package No"],
                        ["departure_city", "Departure City"],
                        ["arrival_city", "Arrival City"],
                        ["airline", "Airline"],
                        ["flight_no_departure", "Departure Flight"],
                        ["flight_no_return", "Return Flight"],
                        ["departure_date", "Departure Date"],
                        ["return_date", "Return Date"],
                        ["days", "Days"],
                        ["nights", "Nights"],
                        ["makkah_nights", "Makkah Nights"],
                        ["madinah_nights", "Madinah Nights"],
                        ["makkah_hotel", "Makkah Hotel"],
                        ["makkah_distance", "Makkah Distance"],
                        ["madinah_hotel", "Madinah Hotel"],
                        ["madinah_distance", "Madinah Distance"],
                        ["sharing_rate", "Sharing Rate"],
                        ["quad_rate", "Quad Rate"],
                        ["triple_rate", "Triple Rate"],
                        ["double_rate", "Double Rate"],
                        ["baggage", "Baggage"],
                        ["pnr", "PNR"],
                        ["group_code", "Group Code"],
                        ["available_seats", "Available Seats"],
                      ].map(([field, label]) => (
                        <label key={field} className="space-y-1">
                          <span className="text-xs text-slate-400">{label}</span>
                          <input
                            type={
                              field.includes("rate") ||
                              field === "available_seats" ||
                              field === "days" ||
                              field === "nights" ||
                              field.includes("nights")
                                ? "number"
                                : field.includes("date")
                                  ? "date"
                                  : "text"
                            }
                            value={(item as any)[field] || ""}
                            onChange={(e) => updateItem(index, field as keyof PackageItem, e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-sm outline-none"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={publishPackage}
                disabled={loading || !items.length}
                className="mt-6 w-full rounded-2xl bg-amber-400 px-5 py-4 text-lg font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50"
              >
                Publish Package Live
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}