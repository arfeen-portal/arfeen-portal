"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

type Point = {
  lat: number;
  lng: number;
  timestamp: string;
  profile_id: string;
};

const defaultCenter: [number, number] = [21.4225, 39.8262];

export default function HistoryMapPage() {
  const [profileId, setProfileId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [markerIcon, setMarkerIcon] = useState<L.Icon | null>(null);

  /**
   * ⚠️ CRITICAL RULE
   * Leaflet uses `window` internally.
   * Icon MUST be created inside useEffect (client-only),
   * NEVER at top-level.
   */
  useEffect(() => {
    const icon = new L.Icon({
      iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
    setMarkerIcon(icon);
  }, []);

  async function loadHistory() {
    if (!profileId) return;

    setLoading(true);
    try {
      const url =
        "/api/locator/history?profile_id=" +
        encodeURIComponent(profileId);

      const res = await fetch(url);
      const json = await res.json();
      let data: Point[] = json.data || [];

      // 🔍 Date filters (same logic as before)
      if (from || to) {
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;

        data = data.filter((p) => {
          const d = new Date(p.timestamp);
          if (fromDate && d < fromDate) return false;
          if (
            toDate &&
            d > new Date(toDate.getTime() + 86400000)
          )
            return false;
          return true;
        });
      }

      // ⏱ Sort by timestamp ASC
      data.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() -
          new Date(b.timestamp).getTime()
      );

      setPoints(data);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const polylinePositions = useMemo(
    () =>
      points.map(
        (p) => [p.lat, p.lng] as [number, number]
      ),
    [points]
  );

  const mapCenter: [number, number] =
    points.length > 0
      ? ([points[0].lat, points[0].lng] as [
          number,
          number
        ])
      : defaultCenter;

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="w-80 border-r bg-white p-4 space-y-4">
        <h2 className="text-lg font-semibold">
          Locator History
        </h2>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">
            Profile ID
          </label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            placeholder="FAMILY / DRIVER23"
            value={profileId}
            onChange={(e) =>
              setProfileId(e.target.value)
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium text-slate-600">
              From
            </label>
            <input
              type="date"
              className="w-full border rounded px-2 py-1 text-sm"
              value={from}
              onChange={(e) =>
                setFrom(e.target.value)
              }
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-600">
              To
            </label>
            <input
              type="date"
              className="w-full border rounded px-2 py-1 text-sm"
              value={to}
              onChange={(e) =>
                setTo(e.target.value)
              }
            />
          </div>
        </div>

        <button
          onClick={loadHistory}
          disabled={!profileId || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded disabled:bg-slate-300"
        >
          {loading ? "Loading…" : "Load history"}
        </button>

        <div className="border rounded max-h-[50vh] overflow-auto text-xs">
          {points.length === 0 && !loading && (
            <div className="p-3 text-slate-500">
              No points found
            </div>
          )}

          {points.map((p, idx) => (
            <div
              key={idx}
              className="px-3 py-2 border-b last:border-b-0"
            >
              <div className="flex justify-between">
                <span>{idx + 1}</span>
                <span className="text-slate-500">
                  {new Date(
                    p.timestamp
                  ).toLocaleString()}
                </span>
              </div>
              <div className="text-slate-600">
                {p.lat.toFixed(5)},{" "}
                {p.lng.toFixed(5)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1">
        <MapContainer
          center={mapCenter}
          zoom={12}
          className="h-full w-full"
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {polylinePositions.length > 1 && (
            <Polyline
              positions={polylinePositions}
            />
          )}

          {markerIcon &&
            points.map((p, i) => (
              <Marker
                key={i}
                position={
                  [p.lat, p.lng] as [
                    number,
                    number
                  ]
                }
                icon={markerIcon as any}
              >
                <Popup>
                  <div className="text-xs space-y-1">
                    <div>
                      <strong>
                        {p.profile_id}
                      </strong>
                    </div>
                    <div>
                      {p.lat.toFixed(5)},{" "}
                      {p.lng.toFixed(5)}
                    </div>
                    <div>
                      {new Date(
                        p.timestamp
                      ).toLocaleString()}
                    </div>
                    <div>
                      Point {i + 1} of{" "}
                      {points.length}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}
