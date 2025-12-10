'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function NotifyTestPage() {
  const [bookingId, setBookingId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAssignAndNotify = async () => {
    if (!bookingId || !driverId) return;

    try {
      setLoading(true);
      setMessage(null);

      const { error: updateError } = await supabase
        .from('transport_bookings')
        .update({ driver_id: driverId })
        .eq('id', bookingId);

      if (updateError) {
        setMessage('Failed to assign driver');
        return;
      }

      const { error: funcError } = await supabase.functions.invoke('notify-driver', {
        body: { booking_id: bookingId },
      });

      if (funcError) {
        setMessage('Driver assigned, but notification failed');
      } else {
        setMessage('Driver assigned + notification sent');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Notify Driver Test</h1>

      <div className="space-y-2 max-w-md">
        <input
          className="border px-3 py-2 rounded w-full"
          placeholder="Booking ID"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
        />
        <input
          className="border px-3 py-2 rounded w-full"
          placeholder="Driver ID"
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
        />

        <button
          onClick={handleAssignAndNotify}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
        >
          {loading ? 'Working...' : 'Assign + Notify'}
        </button>

        {message && <p className="text-sm mt-2">{message}</p>}
      </div>
    </div>
  );
}
