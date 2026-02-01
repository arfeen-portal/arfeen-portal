'use client';

import React, { useEffect, useState } from 'react';

type Voucher = {
  id: string;
  voucher_code: string;
  qr_hash: string;
  status: string;
  issued_at: string;
  booking_id: string;
};

type LatestPing = {
  lat: number;
  lng: number;
  created_at: string;
} | null;

export default function VoucherDetailPage({ params }: { params: { id: string } }) {
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [latestPing, setLatestPing] = useState<LatestPing>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/vouchers/detail?id=${params.id}`);
      const json = await res.json();

      setVoucher(json.voucher || null);
      setLatestPing(json.latest_ping || null);
      setLoading(false);
    };
    load();
  }, [params.id]);

  if (loading || !voucher) {
    return <div className="p-4 text-sm">Loading voucher...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            Voucher #{voucher.voucher_code}
          </h1>
          <p className="text-sm text-muted-foreground">
            Booking: {voucher.booking_id}
          </p>
        </div>

        <img
          src={`/api/vouchers/qr?hash=${voucher.qr_hash}`}
          className="h-40 w-40 bg-white border rounded-xl p-3"
          alt="QR"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-xl p-4 bg-white shadow-sm">
          <h2 className="text-sm font-semibold mb-2">Voucher info</h2>
          <InfoRow label="Status" value={voucher.status} />
          <InfoRow
            label="Issued at"
            value={new Date(voucher.issued_at).toLocaleString()}
          />
          <InfoRow label="Booking ID" value={voucher.booking_id} />
        </div>

        <div className="border rounded-xl p-4 bg-white shadow-sm">
          <h2 className="text-sm font-semibold mb-2">Latest location</h2>
          {latestPing ? (
            <div className="text-xs space-y-1">
              <div>
                <span className="font-semibold">Lat:</span> {latestPing.lat}
              </div>
              <div>
                <span className="font-semibold">Lng:</span> {latestPing.lng}
              </div>
              <div>
                <span className="font-semibold">Time:</span>{' '}
                {new Date(latestPing.created_at).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              No driver ping recorded yet for this booking.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-xs py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
