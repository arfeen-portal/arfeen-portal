'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import dynamicImport from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * 🔒 React-Leaflet components
 * Loaded client-only to avoid TS + SSR issues
 */
const MapContainer = dynamicImport(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
) as any;

const TileLayer = dynamicImport(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
) as any;

const Marker = dynamicImport(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
) as any;

const Popup = dynamicImport(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false }
) as any;

const Polyline = dynamicImport(
  () => import('react-leaflet').then((m) => m.Polyline),
  { ssr: false }
) as any;

type Point = {
  lat: number;
  lng: number;
  timestamp: string;
  profile_id: string;
};

const DEFAULT_CENTER: LatLngExpression = [21.4225, 39.8262];

export default function HistoryMapPage() {
  const [mounted, setMounted] = useState(false);

  const [profileId, setProfileId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [markerIcon, setMarkerIcon] = useState<L.Icon | null>(null);

  useEffect(() => {
    setMounted(true);

    const icon = new L.Icon({
      iconUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    setMarkerIcon(icon);
  }, []);

  if (!mounted) return null;

  async function loadHistory() {
    if (!profileId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/locator/history?profile_id=${encodeURIComponent(profileId)}`
      );
      const json = await res.json();

      let data: Point[] = Array.isArray(json?.data) ? json.data : [];

      if (from || to) {
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;

        data = data.filter((p) => {
          const d = new Date(p.timestamp);
          if (fromDate && d < fromDate) return false;
          if (toDate && d > new Date(toDate.getTime() + 86400000)) return false;
          return true;
        });
      }

      data.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() -
          new Date(b.timestamp).getTime()
      );

      setPoints(data);
    } catch (err) {
      console.error(err);
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }

  const polylinePositions = useMemo(
    () => points.map((p) => [p.lat, p.lng] as LatLngExpression),
    [points]
  );

  const mapCenter: LatLngExpression =
    points.length > 0
      ? [points[0].lat, points[0].lng]
      : DEFAULT_CENTER;

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r bg-white p-4 space-y-3">
        <h2 className="text-lg font-semibold">Locator History</h2>

        <input
          className="w-full border rounded px-2 py-1 text-sm"
          placeholder="Profile / Driver / Agent ID"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <button
          onClick={loadHistory}
          disabled={!profileId || loading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:bg-slate-300"
        >
          {loading ? 'Loading…' : 'Load history'}
        </button>
      </div>

      <div className="flex-1">
        <MapContainer
          center={mapCenter}
          zoom={12}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {polylinePositions.length > 1 && (
            <Polyline positions={polylinePositions} />
          )}

          {markerIcon &&
            points.map((p, i) => (
              <Marker
                key={i}
                position={[p.lat, p.lng]}
                icon={markerIcon}
              >
                <Popup>
                  {p.profile_id}
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}
