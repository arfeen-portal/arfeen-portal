"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type UmrahBatch = {
  id: string;
  title: string;
  created_at?: string | null;
};

type BatchBooking = {
  id: string;
  batch_id: string;
  passenger_name: string;
  passport_no: string;
  created_at?: string | null;
};

type NewBooking = {
  passenger_name: string;
  passport_no: string;
};

export default function BatchDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const supabase = supabaseClient;

  const [batch, setBatch] = useState<UmrahBatch | null>(null);
  const [bookings, setBookings] = useState<BatchBooking[]>([]);
  const [newBooking, setNewBooking] = useState<NewBooking>({
    passenger_name: "",
    passport_no: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fetchBatch = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("umrah_batches")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setBatch(data as UmrahBatch | null);
  };

  const fetchBookings = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("batch_bookings")
      .select("*")
      .eq("batch_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setBookings((data || []) as BatchBooking[]);
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMessage("");

    await Promise.all([fetchBatch(), fetchBookings()]);

    setLoading(false);
  };

  const addBooking = async () => {
    if (!id) return;

    const passengerName = newBooking.passenger_name.trim();
    const passportNo = newBooking.passport_no.trim();

    if (!passengerName || !passportNo) {
      setErrorMessage("Passenger name and passport number are required.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    const { error } = await supabase.from("batch_bookings").insert([
      {
        batch_id: id,
        passenger_name: passengerName,
        passport_no: passportNo,
      },
    ]);

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setNewBooking({ passenger_name: "", passport_no: "" });
    await fetchBookings();
    setSaving(false);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!batch) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Batch not found.
          {errorMessage ? <div className="mt-2 text-sm">{errorMessage}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{batch.title}</h1>
        <p className="text-gray-700">
          Created: {batch.created_at ? batch.created_at.slice(0, 10) : "-"}
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="p-5 border rounded-lg shadow bg-white">
        <h2 className="font-bold text-lg mb-3">Add Booking to Batch</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            className="border p-2 rounded"
            placeholder="Passenger Name"
            value={newBooking.passenger_name}
            onChange={(e) =>
              setNewBooking((prev) => ({
                ...prev,
                passenger_name: e.target.value,
              }))
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Passport No"
            value={newBooking.passport_no}
            onChange={(e) =>
              setNewBooking((prev) => ({
                ...prev,
                passport_no: e.target.value,
              }))
            }
          />
        </div>

        <button
          type="button"
          onClick={addBooking}
          disabled={saving}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Adding..." : "+ Add Booking"}
        </button>
      </div>

      <div className="p-5 border rounded-lg bg-white shadow">
        <h2 className="font-bold text-lg mb-3">Bookings in this Batch</h2>

        <div className="space-y-2">
          {bookings.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-gray-500">
              No bookings found in this batch.
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-3 border rounded-md bg-gray-50"
              >
                <p>
                  <b>{booking.passenger_name}</b>
                </p>
                <p className="text-sm text-gray-700">{booking.passport_no}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}