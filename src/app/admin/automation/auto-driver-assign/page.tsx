"use client";

import { useState } from "react";

export default function AutoDriverAssignPage() {
  const [bookingId, setBookingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleAssign() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/admin/automation/auto-driver-assign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ booking_id: bookingId }),
    });

    const json = await res.json();
    setResult(json);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 to-blue-900 p-8 text-white shadow">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">
            Admin Automation
          </p>
          <h1 className="mt-2 text-3xl font-bold">Auto Driver Assign</h1>
          <p className="mt-2 max-w-3xl text-blue-100">
            Real nearest-driver logic: pickup location, driver location, vehicle match,
            rating score aur availability ke basis par driver assign hota hai.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900">Assign Driver to Booking</h2>
            <p className="mt-1 text-sm text-slate-500">
              Transport booking ID paste karein. Booking mein pickup_lat aur pickup_lng hona zaroori hai.
            </p>

            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              <input
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Transport booking UUID"
                className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-600"
              />

              <button
                onClick={handleAssign}
                disabled={loading || !bookingId}
                className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {loading ? "Assigning..." : "Auto Assign Driver"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Decision Logic</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>Nearest distance priority</p>
              <p>Vehicle type matching bonus</p>
              <p>Driver rating score</p>
              <p>Only available drivers</p>
            </div>
          </div>
        </section>

        {result && (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Result</h2>

            {result.error ? (
              <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                {result.error}
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-emerald-50 p-5">
                    <p className="text-sm text-emerald-700">Selected Driver</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-950">
                      {result.selected_driver?.name}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-5">
                    <p className="text-sm text-blue-700">Phone</p>
                    <p className="mt-1 text-2xl font-bold text-blue-950">
                      {result.selected_driver?.phone || "-"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-5">
                    <p className="text-sm text-amber-700">Vehicle</p>
                    <p className="mt-1 text-2xl font-bold text-amber-950">
                      {result.selected_driver?.vehicle_type || "-"}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-left text-slate-600">
                      <tr>
                        <th className="p-3">Driver</th>
                        <th className="p-3">Vehicle</th>
                        <th className="p-3">Distance</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Vehicle Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.ranked_drivers?.map((row: any) => (
                        <tr key={row.driver.id} className="border-t">
                          <td className="p-3 font-semibold text-slate-900">
                            {row.driver.name}
                          </td>
                          <td className="p-3">{row.driver.vehicle_type || "-"}</td>
                          <td className="p-3">{row.distance_km} KM</td>
                          <td className="p-3">{row.decision_score}</td>
                          <td className="p-3">{row.vehicle_match ? "Yes" : "No"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}