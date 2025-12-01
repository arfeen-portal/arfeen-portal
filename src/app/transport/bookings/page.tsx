import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function TransportBookingsPage() {
  const supabase = await createClient();

  const { data: bookings, error } = await supabase
    .from('transport_bookings')
    .select('*')
    .order('pickup_datetime', { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transport Bookings</h1>
        <Link
          href="/transport/bookings/new"
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm"
        >
          + New Booking
        </Link>
      </div>

      {error && (
        <div className="text-red-600 text-sm">Error loading bookings: {error.message}</div>
      )}

      <div className="bg-white border rounded-lg divide-y">
        {bookings && bookings.length > 0 ? (
          bookings.map((b) => (
            <div key={b.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">
                  {b.pickup_city} → {b.dropoff_city}
                </div>
                <div className="text-xs text-gray-500">
                  {b.pickup_datetime
                    ? new Date(b.pickup_datetime).toLocaleString()
                    : ''}
                  {' • '}
                  Status: {b.status}
                  {b.batch_id ? ` • Batch: ${b.batch_id}` : ''}
                </div>
              </div>
              <div className="text-right text-xs">
                <div>Selling: SAR {Number(b.selling_price || 0).toLocaleString()}</div>
                <div>Cost: SAR {Number(b.supplier_cost || 0).toLocaleString()}</div>
                <div className="font-semibold">
                  Profit:{' '}
                  SAR {Number((b.selling_price || 0) - (b.supplier_cost || 0)).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-gray-500">No bookings found.</div>
        )}
      </div>
    </div>
  );
}
