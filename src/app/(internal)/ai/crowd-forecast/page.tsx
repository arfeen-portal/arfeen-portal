'use client';

import { useEffect, useState } from 'react';

type Forecast = {
  city: string;
  date: string;
  expected_crowd_level: number;
  peak_hours?: string[];
  notes?: string;
};

export default function CrowdForecastPage() {
  const [city, setCity] = useState<'Makkah' | 'Madinah'>('Makkah');
  const [date, setDate] = useState('');
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDate(today);
  }, []);

  async function loadForecast() {
    if (!date) return;
    setLoading(true);
    setError(null);
    setForecast(null);
    try {
      const res = await fetch(
        `/api/crowd/forecast?city=${city}&date=${date}`
      );
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed');
      }
      setForecast(data.forecast);
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (date) loadForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, date]);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Crowd Forecast</h1>
      <p className="text-sm text-gray-500">
        Makkah / Madinah ke liye expected rush level aur peak timings.
      </p>

      <div className="flex flex-wrap gap-3 items-end bg-white p-4 rounded-lg shadow-sm">
        <div className="space-y-1">
          <label className="block text-sm font-medium">City</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={city}
            onChange={(e) => setCity(e.target.value as any)}
          >
            <option value="Makkah">Makkah</option>
            <option value="Madinah">Madinah</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium">Date</label>
          <input
            type="date"
            className="border rounded px-2 py-1 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <button
          onClick={loadForecast}
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {forecast && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold mb-2">
            {forecast.city} – {forecast.date}
          </h2>
          <p className="text-sm mb-2">
            Expected crowd level:{' '}
            <span className="font-bold">
              {forecast.expected_crowd_level}/10
            </span>
          </p>

          {forecast.peak_hours && (
            <div className="mb-2">
              <div className="text-sm font-medium mb-1">Peak hours:</div>
              <div className="flex flex-wrap gap-2 text-xs">
                {forecast.peak_hours.map((ph, idx) => (
                  <span
                    key={idx}
                    className="border rounded-full px-3 py-1"
                  >
                    {ph}
                  </span>
                ))}
              </div>
            </div>
          )}

          {forecast.notes && (
            <p className="text-xs text-gray-500 mt-2">{forecast.notes}</p>
          )}

          <div className="mt-4 text-xs text-gray-500">
            Tip: Green slots pe Tawaf / Rawdah plan karein, red times se
            avoid karein.
          </div>
        </div>
      )}
    </div>
  );
}
