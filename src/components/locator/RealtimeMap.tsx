"use client";

import { useEffect, useMemo, useState } from "react";

type LiveLocation = {
  id: string;
  profile_id: string;
  role: "driver" | "family" | "agent";
  label: string | null;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  last_seen_at: string;
};

const ROLE_COLORS: Record<LiveLocation["role"], string> = {
  driver: "#2563eb",
  family: "#16a34a",
  agent: "#f97316",
};

export function RealtimeMap() {
  const [items, setItems] = useState<LiveLocation[]>([]);
  const [roleFilter, setRoleFilter] = useState<LiveLocation["role"] | "all">(
    "all"
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/locator/live");
        const json = await res.json();
        if (!cancelled && json.items) setItems(json.items);
      } catch (e) {
        console.error(e);
      }
    }

    load();
    const id = setInterval(load, 7000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const filtered = useMemo(
    () =>
      roleFilter === "all"
        ? items
        : items.filter((x) => x.role === roleFilter),
    [items, roleFilter]
  );

  const center = useMemo(() => {
    if (!filtered.length) return { lat: 21.4225, lng: 39.8262 }; // Makkah
    const lat = filtered.reduce((s, x) => s + x.lat, 0) / filtered.length;
    const lng = filtered.reduce((s, x) => s + x.lng, 0) / filtered.length;
    return { lat, lng };
  }, [filtered]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-4 h-[75vh]">
      {/* MAP */}
      <div className="relative rounded-2xl border shadow-sm overflow-hidden">
        <iframe
          title="live-map"
          className="w-full h-full"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${
            center.lng - 0.2
          }%2C${center.lat - 0.2}%2C${center.lng + 0.2}%2C${
            center.lat + 0.2
          }&layer=mapnik`}
        />
        <div className="absolute top-3 left-3 flex gap-2 bg-white/80 rounded-full px-3 py-1 text-xs">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-2 py-1 rounded-full ${
              roleFilter === "all" ? "bg-black text-white" : ""
            }`}
          >
            All
          </button>
          <button
            onClick={() => setRoleFilter("driver")}
            className="px-2 py-1 rounded-full border"
            style={{ borderColor: ROLE_COLORS.driver }}
          >
            Drivers
          </button>
          <button
            onClick={() => setRoleFilter("family")}
            className="px-2 py-1 rounded-full border"
            style={{ borderColor: ROLE_COLORS.family }}
          >
            Families
          </button>
          <button
            onClick={() => setRoleFilter("agent")}
            className="px-2 py-1 rounded-full border"
            style={{ borderColor: ROLE_COLORS.agent }}
          >
            Agents
          </button>
        </div>
      </div>

      {/* SIDE LIST */}
      <div className="flex flex-col rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-semibold text-sm">
            Live travellers & drivers ({filtered.length})
          </div>
          <div className="text-xs text-muted-foreground">Auto-refresh 7s</div>
        </div>
        <div className="flex-1 overflow-y-auto text-sm">
          {filtered.length === 0 && (
            <div className="p-4 text-xs text-muted-foreground">
              No live locations found in last few minutes.
            </div>
          )}
          {filtered.map((x) => (
            <div
              key={x.id}
              className="px-4 py-3 border-b flex items-start gap-3 hover:bg-muted/40"
            >
              <div
                className="mt-1 h-2 w-2 rounded-full"
                style={{ backgroundColor: ROLE_COLORS[x.role] }}
              />
              <div>
                <div className="font-medium">
                  {x.label || x.role.toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {x.lat.toFixed(4)}, {x.lng.toFixed(4)} •{" "}
                  {new Date(x.last_seen_at).toLocaleTimeString()}
                </div>
                {x.speed != null && (
                  <div className="text-[11px] mt-1">
                    Speed: {x.speed.toFixed(1)} km/h
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
