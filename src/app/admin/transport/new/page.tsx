"use client";

import { useState } from "react";

export default function NewTransportBookingPage() {
  const [form, setForm] = useState({
    agent_id: "",
    pickup_city: "",
    dropoff_city: "",
    date: "",
    time: "",
    vehicle_type: "",
    passengers: 1,
    price: 0,
  });

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("/api/transport/create", {
      method: "POST",
      body: JSON.stringify(form),
    });

    alert("Booking Created!");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-5 rounded-xl">
      <h1 className="text-lg font-semibold">New Transport Booking</h1>

      <input
        placeholder="Agent ID"
        className="border p-2 rounded w-full"
        onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
      />

      <input
        placeholder="Pickup City"
        className="border p-2 rounded w-full"
        onChange={(e) => setForm({ ...form, pickup_city: e.target.value })}
      />

      <input
        placeholder="Dropoff City"
        className="border p-2 rounded w-full"
        onChange={(e) => setForm({ ...form, dropoff_city: e.target.value })}
      />

      <input
        type="date"
        className="border p-2 rounded w-full"
        onChange={(e) => setForm({ ...form, date: e.target.value })}
      />

      <input
        type="time"
        className="border p-2 rounded w-full"
        onChange={(e) => setForm({ ...form, time: e.target.value })}
      />

      <input
        placeholder="Vehicle Type"
        className="border p-2 rounded w-full"
        onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
      />

      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Create Booking
      </button>
    </form>
  );
}
