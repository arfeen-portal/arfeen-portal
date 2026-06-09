import { supabaseClient } from "@/lib/supabaseClient";

interface PageProps {
  params: { id: string };
}

export default async function BatchSummaryPage({ params }: PageProps) {
  const supabase = supabaseClient;

  const batchId = params.id;

  const { data: summary, error: summaryError } = await supabase
    .from("batch_profit_summary_v")
    .select("*")
    .eq("batch_id", batchId)
    .maybeSingle();

  const { data: bookings, error: bookingsError } = await supabase
    .from("transport_bookings")
    .select("*")
    .eq("batch_id", batchId)
    .order("pickup_datetime", { ascending: true });

  if (summaryError) {
    return (
      <div className="p-6 text-red-600 text-sm">
        Failed to load batch summary: {summaryError.message}
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="p-6 text-red-600 text-sm">
        Failed to load bookings: {bookingsError.message}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Batch Summary</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded bg-white">
          <div className="text-xs text-gray-500">Total Bookings</div>
          <div className="text-xl font-semibold">
            {summary?.total_bookings ?? bookings?.length ?? 0}
          </div>
        </div>

        <div className="p-4 border rounded bg-white">
          <div className="text-xs text-gray-500">Total Selling</div>
          <div className="text-xl font-semibold">
            SAR {Number(summary?.total_selling ?? 0).toLocaleString()}
          </div>
        </div>

        <div className="p-4 border rounded bg-white">
          <div className="text-xs text-gray-500">Profit</div>
          <div className="text-xl font-semibold">
            SAR {Number(summary?.profit ?? 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="border rounded bg-white">
        {bookings && bookings.length > 0 ? (
          bookings.map((b: any) => (
            <div
              key={b.id}
              className="flex justify-between p-4 border-b last:border-0"
            >
              <div>
                <div className="font-medium text-sm">
                  {b.pickup_city} → {b.dropoff_city}
                </div>
                <div className="text-xs text-gray-500">
                  {b.pickup_datetime
                    ? new Date(b.pickup_datetime).toLocaleString()
                    : "-"}
                </div>
              </div>

              <div className="text-xs text-right">
                <div>
                  Selling: SAR {Number(b.selling_price ?? 0).toLocaleString()}
                </div>
                <div>
                  Cost: SAR {Number(b.supplier_cost ?? 0).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-gray-500">
            No bookings found.
          </div>
        )}
      </div>
    </div>
  );
}