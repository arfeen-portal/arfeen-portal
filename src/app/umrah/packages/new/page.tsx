'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

interface HotelOption {
  id: string;
  label: string;
}

export default function NewUmrahPackagePage() {
  const router = useRouter();
  const supabase = createClient();

  const [hotelsMakkah, setHotelsMakkah] = useState<HotelOption[]>([]);
  const [hotelsMadinah, setHotelsMadinah] = useState<HotelOption[]>([]);

  const [form, setForm] = useState({
    code: '',
    name: '',
    origin_city: '',
    nights_makkah: 0,
    nights_madinah: 0,
    hotel_makkah_id: '',
    hotel_madinah_id: '',
    base_hotel_cost: 0,
    ticket_cost: 0,
    visa_cost: 0,
    profit_amount: 0,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const loadHotels = async () => {
      const { data, error } = await supabase
        .from('hotel_options_v')
        .select('*');

      if (error) {
        console.error(error);
        return;
      }

      const makkah = [];
      const madinah = [];

      data.forEach((h: any) => {
        const option = { id: h.id, label: `${h.name} (${h.city})` };
        if ((h.city || '').toLowerCase().includes('makkah')) {
          makkah.push(option);
        } else if ((h.city || '').toLowerCase().includes('madinah')) {
          madinah.push(option);
        }
      });

      setHotelsMakkah(makkah);
      setHotelsMadinah(madinah);
    };

    loadHotels();
  }, [supabase]);

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.from('umrah_packages').insert({
      code: form.code.trim(),
      name: form.name.trim(),
      origin_city: form.origin_city.trim(),
      nights_makkah: Number(form.nights_makkah) || 0,
      nights_madinah: Number(form.nights_madinah) || 0,
      hotel_makkah_id: form.hotel_makkah_id || null,
      hotel_madinah_id: form.hotel_madinah_id || null,
      base_hotel_cost: Number(form.base_hotel_cost) || 0,
      ticket_cost: Number(form.ticket_cost) || 0,
      visa_cost: Number(form.visa_cost) || 0,
      profit_amount: Number(form.profit_amount) || 0,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setErrorMsg(error.message);
      return;
    }

    router.push('/umrah/packages');
  };

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">New Umrah Package</h1>

      {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}

      <form onSubmit={onSubmit} className="bg-white border rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Basic fields same as before... */}
          <div>
            <label className="block text-xs font-medium mb-1">Code</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.code}
              onChange={(e) => updateField('code', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Name</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Origin City</label>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.origin_city}
              onChange={(e) => updateField('origin_city', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Nights in Makkah</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.nights_makkah}
              onChange={(e) => updateField('nights_makkah', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Nights in Madinah</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.nights_madinah}
              onChange={(e) => updateField('nights_madinah', e.target.value)}
            />
          </div>

          {/* Hotel dropdowns */}
          <div>
            <label className="block text-xs font-medium mb-1">Makkah Hotel</label>
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.hotel_makkah_id}
              onChange={(e) => updateField('hotel_makkah_id', e.target.value)}
            >
              <option value="">Select</option>
              {hotelsMakkah.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Madinah Hotel</label>
            <select
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.hotel_madinah_id}
              onChange={(e) => updateField('hotel_madinah_id', e.target.value)}
            >
              <option value="">Select</option>
              {hotelsMadinah.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>

          {/* Costs */}
          <div>
            <label className="block text-xs font-medium mb-1">
              Base Hotel Cost (SAR)
            </label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.base_hotel_cost}
              onChange={(e) => updateField('base_hotel_cost', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Ticket Cost (SAR)
            </label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.ticket_cost}
              onChange={(e) => updateField('ticket_cost', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Visa Cost (SAR)</label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.visa_cost}
              onChange={(e) => updateField('visa_cost', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">
              Profit Amount (SAR)
            </label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm"
              value={form.profit_amount}
              onChange={(e) => updateField('profit_amount', e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm"
        >
          {loading ? 'Saving...' : 'Save Package'}
        </button>
      </form>
    </div>
  );
}
