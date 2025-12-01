"use client";

import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";

export default function SmartBookingAI() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const extract = async () => {
    if (!file) return alert("Upload ticket first");
    setLoading(true);

    const form = new FormData();
    form.append("file", file);

    // Backend endpoint you will add later
    const res = await fetch("/api/smart/extract", {
      method: "POST",
      body: form,
    });

    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  return (
    <div>
      <PageHeader
        title="Smart Booking (AI)"
        subtitle="Extract flight details automatically from your ticket"
      />

      <div className="p-5 bg-white border rounded shadow space-y-4">
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={extract}
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          {loading ? "Extracting…" : "Extract with AI"}
        </button>

        {data && (
          <div className="p-4 bg-slate-100 rounded mt-4 text-sm">
            <p><b>Passenger:</b> {data.passenger}</p>
            <p><b>From:</b> {data.from}</p>
            <p><b>To:</b> {data.to}</p>
            <p><b>Flight:</b> {data.flight}</p>
            <p><b>Date:</b> {data.date}</p>
            <p><b>Time:</b> {data.time}</p>
          </div>
        )}
      </div>
    </div>
  );
}
