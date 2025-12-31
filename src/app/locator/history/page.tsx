'use client';

/**
 * IMPORTANT:
 * next/dynamic ko rename kiya gaya hai (dynamicImport)
 * taake `export const dynamic` se conflict na ho
 */
export const dynamic = 'force-dynamic';

import dynamicImport from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import 'leaflet/dist/leaflet.css';

/* ================= TYPES ================= */
type Point = {
  lat: number;
  lng: number;
  timestamp: string;
  profile_id: string;
};

const DEFAULT_CENTER: [number, number] = [21.4225, 39.8262];

/* ================= DYNAMIC LEAFLET (SSR SAFE) ================= */
const MapContainer: any = dynamicImport(
  () => import('react-leaflet').then(m => m.MapContainer),
  { ssr: false }
);
const TileLayer: any = dynamicImport(
  () => import('react-leaflet').then(m => m.TileLayer),
  { ssr: false }
);
const Marker: any = dynamicImport(
  () => import('react-leaflet').then(m => m.Marker),
  { ssr: false }
);
const Popup: any = dynamicImport(
  () => import('react-leaflet').then(m => m.Popup),
  { ssr: false }
);
const Polyline: any = dynamicImport(
  () => import('react-leaflet').then(m => m.Polyline),
  { ssr: false }
);

/* ================= PAGE ================= */
export default function LocatorHistoryPage() {
  const [profileId, setProfileId] = useState('');
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [markerIcon, setMarkerIcon] = useState<any>(null);

  /* ---- Leaflet icon (CLIENT ONLY) ---- */
  useEffect(() => {
    import('leaflet').then(L => {
      const icon = new L.Icon({
        iconUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      setMarkerIcon(icon);
    });
  }, []);

  /* ---- LOAD HISTORY (PURANI LOGIC PRESERVED) ---- */
  async function loadHistory() {
    if (!profileId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/locator/history?profile_id=${encodeURIComponent(profileId)}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      setPoints(json.points ?? []);
    } catch (err) {
      console.error('History fetch error', err);
    } finally {
      setLoading(false);
    }
  }

  /* ---- MAP HELPERS ---- */
  const polyline = useMemo(
    () => points.map(p => [p.lat, p.lng] as [number, number]),
    [points]
  );

  const mapCenter: [number, number] =
    points.length > 0
      ? [points[0].lat, points[0].lng]
      : DEFAULT_CENTER;

  /* ================= UI ================= */
  return (
    <div className="h-screen flex">
      {/* LEFT PANEL */}
      <div className="w-80 border-r bg-white p-4 space-y-3 text-sm">
        <h2 className="font-bold">Locator History</h2>

        <input
          className="w-full border px-2 py-1 rounded"
          placeholder="profile_id"
          value={profileId}
          onChange={e => setProfileId(e.target.value)}
        />

        <button
          onClick={loadHistory}
          disabled={!profileId || loading}
          className="w-full bg-blue-600 text-white py-1 rounded disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Load History'}
        </button>

        <div className="max-h-[60vh] overflow-auto">
          {points.length === 0 && (
            <div className="text-gray-400">No points</div>
          )}
          {points.map((p, i) => (
            <div key={i} className="border-b py-1">
              <div>{new Date(p.timestamp).toLocaleString()}</div>
              <div className="text-gray-500">
                {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAP */}
      <div className="flex-1">
        {typeof window !== 'undefined' && (
          <MapContainer
            center={mapCenter}
            zoom={12}
            className="h-full w-full"
            scrollWheelZoom
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            {polyline.length > 1 && (
              <Polyline positions={polyline} />
            )}

            {markerIcon &&
              points.map((p, i) => (
                <Marker
                  key={i}
                  position={[p.lat, p.lng]}
                  icon={markerIcon}
                >
                  <Popup>
                    <div className="text-xs space-y-1">
                      <div>
                        <strong>{p.profile_id}</strong>
                      </div>
                      <div>{new Date(p.timestamp).toLocaleString()}</div>
                      <div>
                        {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
