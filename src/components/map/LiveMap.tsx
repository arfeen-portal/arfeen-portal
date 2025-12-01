// @ts-nocheck
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Point = {
  lat: number;
  lng: number;
  created_at?: string;
};

export default function LiveMap({ points = [] }: { points?: Point[] }) {
  const last = points.length > 0 ? points[points.length - 1] : null;

  // Default centre – Makkah
  const center: [number, number] = last
    ? [last.lat, last.lng]
    : [21.422487, 39.826206];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {points.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lng]}>
          <Popup>
            Point #{i + 1}
            <br />
            {p.created_at
              ? new Date(p.created_at).toLocaleString()
              : null}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
