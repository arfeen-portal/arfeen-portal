"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function NotifyTestPage() {
  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const sendTest = async () => {
    if (!bookingId) return;

    setLoading(true);
    setResult("");

    try {
      // Lightweight test query to verify Supabase client works
      const { data, error } = await supabase
        .from("transport_bookings")
        .select("id, status")
        .eq("id", bookingId)
        .maybeSingle();

      if (error) throw error;

      setResult(
        data
          ? JSON.stringify(data, null, 2)
          : "No record found"
      );
    } catch (e: any) {
      setResult(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Notify Test</h1>

      <div className="space-y-1">
        <label className="block text-sm text-gray-600">
          Booking ID
        </label>
        <input
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          placeholder="Paste booking id…"
        />
      </div>

      <button
        onClick={sendTest}
        disabled={loading || !bookingId}
        className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test"}
      </button>

      <pre className="rounded-lg border bg-gray-50 p-3 text-xs overflow-auto">
        {result}
      </pre>
    </div>
  );
}
