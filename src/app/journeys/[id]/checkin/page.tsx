'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

const ACTIVITIES = [
  { key: 'tawaf', label: 'Tawaf' },
  { key: 'saee', label: 'Saee' },
  { key: 'quran_pages', label: 'Quran Pages' },
  { key: 'sadqa', label: 'Sadqa' },
];

export default function SpiritualCheckinPage() {
  const params = useParams();
  const journeyId = params?.id as string;

  const [activityKey, setActivityKey] = useState('tawaf');
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const res = await fetch('/api/spiritual/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: null, // TODO: client side se current user id pass karo
        journeyId,
        activityKey,
        placeId: null,
        quantity,
      }),
    });

    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMsg(json.error || 'Failed to save');
    } else {
      setMsg('Saved ✔');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Spiritual Check-In</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm p-4 space-y-3 max-w-sm"
      >
        <div className="flex flex-col gap-1 text-xs">
          <label className="font-medium">Activity</label>
          <select
            className="border rounded px-2 py-1"
            value={activityKey}
            onChange={(e) => setActivityKey(e.target.value)}
          >
            {ACTIVITIES.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 text-xs">
          <label className="font-medium">Quantity</label>
          <input
            type="number"
            className="border rounded px-2 py-1"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded bg-[#0b3d91] text-white text-xs font-semibold py-2"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        {msg && <p className="text-xs mt-2">{msg}</p>}
      </form>
    </div>
  );
}
