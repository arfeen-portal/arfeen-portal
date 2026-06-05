"use client";

import { useEffect, useState } from "react";
import { Car, Hotel, MapPin, Plane, Radar, Users } from "lucide-react";

type LocationItem = {
  id: string;
  name: string;
  city: string;
  status: string;
  type: string;
};

export default function LiveMapPage() {
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/ai/live-map", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load live map");
        const json = await res.json();
        setLocations(Array.isArray(json?.locations) ? json.locations : []);
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
        setLocations([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#050816] p-6 text-white">
      <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 p-7 shadow-2xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              <Radar className="h-4 w-4" />
              Live Operations Layer
            </div>
            <h1 className="text-4xl font-black">Live Map</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
              Real-time view of passengers, active drivers, hotel check-ins,
              airport arrivals, delayed transport, and VIP movements.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Live Signals</p>
            <h2 className="text-4xl font-black text-emerald-200">
              {locations.length}
            </h2>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-red-100">
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-white/10 bg-slate-950">
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(#ffffff16_1px,transparent_1px),linear-gradient(90deg,#ffffff16_1px,transparent_1px)] [background-size:42px_42px]" />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />

            {loading ? (
              <p className="relative z-10 p-6 text-sm text-slate-400">
                Loading live map...
              </p>
            ) : locations.length === 0 ? (
              <p className="relative z-10 p-6 text-sm text-slate-400">
                No live locations available.
              </p>
            ) : (
              locations.slice(0, 8).map((loc, index) => (
                <div
                  key={loc.id}
                  className="absolute z-10"
                  style={{
                    left: `${14 + ((index * 19) % 68)}%`,
                    top: `${16 + ((index * 17) % 58)}%`,
                  }}
                >
                  <div className="rounded-full bg-emerald-400 p-3 shadow-lg shadow-emerald-500/30 ring-8 ring-emerald-400/10">
                    <MapPin className="h-4 w-4 text-slate-950" />
                  </div>
                  <div className="mt-2 rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs">
                    {loc.name}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="mb-5 text-xl font-bold">Live Locations</h2>

            <div className="space-y-3">
              {locations.map((loc) => (
                <div key={loc.id} className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
                  <div className="flex items-center gap-3">
                    <TypeIcon type={loc.type} />
                    <div className="flex-1">
                      <h3 className="font-bold">{loc.name}</h3>
                      <p className="text-sm text-slate-400">
                        {loc.city} · {loc.type}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                      {loc.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function TypeIcon({ type }: { type: string }) {
  const t = String(type || "").toLowerCase();
  const icon =
    t.includes("driver") ? <Car /> :
    t.includes("hotel") ? <Hotel /> :
    t.includes("flight") ? <Plane /> :
    t.includes("passenger") ? <Users /> :
    <MapPin />;

  return (
    <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-200">
      {icon}
    </div>
  );
}