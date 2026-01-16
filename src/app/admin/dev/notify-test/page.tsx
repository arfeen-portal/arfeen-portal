"use client";

import { useState } from "react";
export default function NotifyTestPage() {
  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const sendTest = async () => {
    setLoading(true);
    setResult("");

    try {
      // Example: just a lightweight query to verify client works
      // Aap apna actual logic yahan rakh sakte ho
      const { data, error } = await supabase
        .from("transport_bookings")
        .select("id,status")
        .eq("id", bookingId)
        .maybeSingle();

      if (error) throw error;

      setResult(data ? JSON.stringify(data, null, 2) : "No record found");
    } catch (e: any) {
      setResult(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Notify Test</h1>

      <div className="space-y-2">
        <label className="block text-sm text-gray-600">Booking ID</label>
        <input
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Paste booking id..."
        />
      </div>

      <button
        onClick={sendTest}
        disabled={loading || !bookingId}
        className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test"}
      </button>

      <pre className="rounded-lg border bg-gray-50 p-3 text-sm overflow-auto">
        {result}
      </pre>
    </div>
  );
}
