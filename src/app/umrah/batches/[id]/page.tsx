"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function BatchDetail() {
  const { id } = useParams();
  const supabase = createClient();

  const [batch, setBatch] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({
    passenger_name: "",
    passport_no: ""
  });

  const fetchBatch = async () => {
    const { data } = await supabase
      .from("umrah_batches")
      .select("*")
      .eq("id", id)
      .single();

    setBatch(data);
  };

  const fetchBookings = async () => {
    const { data } = await supabase
      .from("batch_bookings")
      .select("*")
      .eq("batch_id", id);

    setBookings(data || []);
  };

  const addBooking = async () => {
    await supabase.from("batch_bookings").insert({
      batch_id: id,
      passenger_name: newBooking.passenger_name,
      passport_no: newBooking.passport_no
    });

    setNewBooking({ passenger_name: "", passport_no: "" });
    fetchBookings();
  };

  useEffect(() => {
    fetchBatch();
    fetchBookings();
  }, []);

  if (!batch) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{batch.title}</h1>
      <p className="text-gray-700">Created: {batch.created_at?.slice(0, 10)}</p>

      <div className="p-5 border rounded-lg shadow bg-white">
        <h2 className="font-bold text-lg mb-3">Add Booking to Batch</h2>

        <div className="grid grid-cols-2 gap-3">
          <input
            className="border p-2 rounded"
            placeholder="Passenger Name"
            value={newBooking.passenger_name}
            onChange={(e) =>
              setNewBooking({ ...newBooking, passenger_name: e.target.value })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Passport No"
            value={newBooking.passport_no}
            onChange={(e) =>
              setNewBooking({ ...newBooking, passport_no: e.target.value })
            }
          />
        </div>

        <button
          onClick={addBooking}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
        >
          + Add Booking
        </button>
      </div>

      <div className="p-5 border rounded-lg bg-white shadow">
        <h2 className="font-bold text-lg mb-3">Bookings in this Batch</h2>
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="p-3 border rounded-md bg-gray-50">
              <p><b>{b.passenger_name}</b></p>
              <p className="text-sm text-gray-700">{b.passport_no}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
