// src/app/locator/history/page.tsx
// @ts-nocheck
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

const defaultCenter = [21.4225, 39.8262];

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function HistoryMapPage() {
  const [profileId, setProfileId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadHistory() {
    if (!profileId) return;
    setLoading(true);
    try {
      const url =
        "/api/locator/history?profile_id=" +
        encodeURIComponent(profileId);
      const res = await fetch(url);
      const json = await res.json();
      let data = json.data || [];

      if (from || to) {
        const fromDate = from
          ? new Date(from)
          : null;
        const toDate = to ? new Date(to) : null;

        data = data.filter((p) => {
          const t = new Date(p.timestamp);
          if (fromDate && t < fromDate)
            return false;
          if (
            toDate &&
            t >
              new Date(
                toDate.getTime() +
                  24 * 60 * 60 * 1000
              )
          )
            return false;
          return true;
        });
      }

      data.sort(
        (a, b) =>
          new Date(a.timestamp) -
          new Date(b.timestamp)
      );

      setPoints(data);
    } catch (e) {
      console.error("history fetch error", e);
    } finally {
      setLoading(false);
    }
  }

  const polylinePositions = useMemo(
    () =>
      points.map((p) => [
        p.lat,
        p.lng,
      ]),
    [points]
  );

  const mapCenter =
    points.length > 0
      ? [points[0].lat, points[0].lng]
      : defaultCenter;

  return (
    <div className="min-h-screen flex">
      {/* Left filters */}
      <div className="w-80 border-r bg-white p-4 space-y-4">
        <h1 className="text-lg font-semibold">
          Locator History
        </h1>

        <div className="space-y-2 text-xs">
          <label className="font-medium text-slate-600">
            Profile ID
          </label>
          <input
            className="w-full border rounded-md px-2 py-1 text-sm"
            placeholder="e.g. FAMILY1 or DRIVER23"
            value={profileId}
            onChange={(e) =>
              setProfileId(e.target.value)
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-slate-600">
              From
            </label>
            <input
              type="date"
              className="w-full border rounded-md px-2 py-1 text-sm"
              value={from}
              onChange={(e) =>
                setFrom(e.target.value)
              }
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium text-slate-600">
              To
            </label>
            <input
              type="date"
              className="w-full border rounded-md px-2 py-1 text-sm"
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-md disabled:bg-slate-300"
        >
          {loading
            ? "Loading..."
            : "Load history"}
        </button>

        <div className="border rounded-md max-h-[50vh] overflow-auto text-xs">
          {points.length === 0 &&
            !loading && (
              <div className="p-3 text-slate-500">
                No points yet.
              </div>
            )}
          {points.map((p, idx) => (
            <div
              key={p.id}
              className="px-3 py-2 border-b last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  #{idx + 1}
                </span>
                <span className="text-[11px] text-slate-500">
                  {new Date(
                    p.timestamp
                  ).toLocaleString()}
                </span>
              </div>
              <div className="text-[11px] text-slate-600">
                {p.lat.toFixed(5)},{" "}
                {p.lng.toFixed(5)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer
          center={mapCenter}
          zoom={12}
          className="w-full h-screen"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {polylinePositions.length > 1 && (
            <Polyline positions={polylinePositions} />
          )}
          {points.map((p, i) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={markerIcon}
            >
              <Popup>
                <div className="text-xs">
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
                    Point #{i + 1} of{" "}
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
