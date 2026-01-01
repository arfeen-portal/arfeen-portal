"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

// react-leaflet ko SSR safe banane ke liye dynamic import
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false },
) as any;
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false },
) as any;
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false },
) as any;
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false },
) as any;
const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false },
) as any;

type ProfileRole = "driver" | "family" | "agent";

type LiveProfile = {
  id: string;
  name: string;
  role: ProfileRole;
  lat: number;
  lng: number;
  last_seen: string;
};

type HistoryPoint = {
  lat: number;
  lng: number;
  recorded_at: string;
};

const roleLabel: Record<ProfileRole, string> = {
  driver: "Driver",
  family: "Family",
  agent: "Agent",
};

const roleColor: Record<ProfileRole, string> = {
  driver: "bg-blue-500",
  family: "bg-pink-500",
  agent: "bg-emerald-500",
};

export default function LocatorPage() {
  const [liveProfiles, setLiveProfiles] = useState<LiveProfile[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);
  const [selectedRole, setSelectedRole] = useState<ProfileRole | "all">("all");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Default center: Makkah
  const center = useMemo<[number, number]>(() => {
    if (liveProfiles.length === 0) return [21.4225, 39.8262];
    const first = liveProfiles[0];
    return [first.lat, first.lng];
  }, [liveProfiles]);

  const filteredProfiles = useMemo(() => {
    if (selectedRole === "all") return liveProfiles;
    return liveProfiles.filter((p) => p.role === selectedRole);
  }, [liveProfiles, selectedRole]);

  const selectedProfile = useMemo(
    () => liveProfiles.find((p) => p.id === selectedProfileId) || null,
    [liveProfiles, selectedProfileId],
  );

  // Live positions loader (polling)
  useEffect(() => {
    async function loadLive() {
      try {
        const res = await fetch("/api/locator/live");
        const json = await res.json();
        setLiveProfiles(json ?? []);
      } catch (e) {
        console.error("Error fetching live locator data", e);
      } finally {
        setLoadingLive(false);
      }
    }

    loadLive();
    const id = setInterval(loadLive, 15000); // 15 sec refresh
    return () => clearInterval(id);
  }, []);

  async function loadHistory(profileId: string) {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/locator/history?profileId=${profileId}`);
      const json = await res.json();
      setHistory(json ?? []);
    } catch (e) {
      console.error("Error fetching history", e);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  function handleSelectProfile(profileId: string) {
    setSelectedProfileId(profileId);
    loadHistory(profileId);
  }

  return (
    <div className="px-4 lg:px-8 py-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-slate-900">
            Live Locator
          </h1>
          <p className="text-sm text-slate-500">
            Track drivers, family and agents in real-time on the map.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <FilterButton
            active={selectedRole === "all"}
            onClick={() => setSelectedRole("all")}
          >
            All
          </FilterButton>
          <FilterButton
            active={selectedRole === "driver"}
            onClick={() => setSelectedRole("driver")}
          >
            Drivers
          </FilterButton>
          <FilterButton
            active={selectedRole === "family"}
            onClick={() => setSelectedRole("family")}
          >
            Family
          </FilterButton>
          <FilterButton
            active={selectedRole === "agent"}
            onClick={() => setSelectedRole("agent")}
          >
            Agents
          </FilterButton>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Map + list */}
        <div className="xl:col-span-3 rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Real-time Map
            </h2>
          </div>

          {/* Map */}
          <div className="w-full h-[420px] rounded-xl overflow-hidden border border-slate-200">
            <MapContainer
              center={center}
              zoom={11}
              scrollWheelZoom={true}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {filteredProfiles.map((p) => (
                <Marker
                  key={p.id}
                  position={[p.lat, p.lng]}
                  eventHandlers={{
                    click: () => handleSelectProfile(p.id),
                  }}
                >
                  <Popup>
                    <div className="space-y-1">
                      <div className="font-semibold text-sm">{p.name}</div>
                      <div className="text-xs text-slate-500">
                        {roleLabel[p.role]} •{" "}
                        {new Date(p.last_seen).toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-slate-400">
                        {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* History polyline for selected profile */}
              {selectedProfile && history.length > 1 && (
                <Polyline positions={history.map((h) => [h.lat, h.lng])} />
              )}
            </MapContainer>
          </div>

          {/* Multi-user list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {loadingLive && (
              <div className="text-xs text-slate-500">
                Loading live locations…
              </div>
            )}
            {!loadingLive && filteredProfiles.length === 0 && (
              <div className="text-xs text-slate-500">
                No active devices found.
              </div>
            )}
            {filteredProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectProfile(p.id)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${
                  selectedProfileId === p.id
                    ? "border-blue-500 bg-blue-50/60"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div>
                  <div className="font-medium text-slate-800">{p.name}</div>
                  <div className="text-[11px] text-slate-500">
                    Last seen:{" "}
                    {new Date(p.last_seen).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <span
                  className={`text-[10px] text-white px-2 py-0.5 rounded-full ${roleColor[p.role]}`}
                >
                  {roleLabel[p.role]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* History / timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 max-h-[460px] overflow-auto">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            Location History
          </h2>

          {!selectedProfile && (
            <div className="text-xs text-slate-500">
              Select a person from the map or list to see their history.
            </div>
          )}

          {selectedProfile && (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-slate-800">
                  {selectedProfile.name}
                </div>
                <span
                  className={`text-[10px] text-white px-2 py-0.5 rounded-full ${roleColor[selectedProfile.role]}`}
                >
                  {roleLabel[selectedProfile.role]}
                </span>
              </div>

              {loadingHistory && (
                <div className="text-xs text-slate-500">
                  Loading timeline…
                </div>
              )}

              {!loadingHistory && history.length === 0 && (
                <div className="text-xs text-slate-500">
                  No history available for today.
                </div>
              )}

              {!loadingHistory &&
                history.map((h, idx) => (
                  <div
                    key={`${h.recorded_at}-${idx}`}
                    className="border-l border-slate-200 pl-3 pb-2 relative"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500 absolute -left-1 top-1" />
                    <div className="text-xs font-medium text-slate-800">
                      {new Date(h.recorded_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Lat: {h.lat.toFixed(4)}, Lng: {h.lng.toFixed(4)}
                    </div>
                  </div>
                ))}

              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="mt-2 text-xs px-2 py-1 rounded-lg border border-slate-300 hover:bg-slate-50"
                >
                  Clear history view
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-xl border ${
        active
          ? "bg-blue-700 text-white border-blue-700"
          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}
