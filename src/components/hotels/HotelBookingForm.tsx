"use client";
import { useState } from "react";

export default function HotelBookingForm({ onSubmit }: any) {
  const [hotelName, setHotelName] = useState("");
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [price, setPrice] = useState("");

  function handleSubmit(e: any) {
    e.preventDefault();
    onSubmit({ hotelName, city, checkIn, checkOut, price });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Hotel Name"
        className="border p-2 w-full"
        onChange={(e) => setHotelName(e.target.value)}
      />

      <input
        type="text"
        placeholder="City"
        className="border p-2 w-full"
        onChange={(e) => setCity(e.target.value)}
      />

      <input
        type="datetime-local"
        className="border p-2 w-full"
        onChange={(e) => setCheckIn(e.target.value)}
      />

      <input
        type="datetime-local"
        className="border p-2 w-full"
        onChange={(e) => setCheckOut(e.target.value)}
      />

      <input
        type="number"
        placeholder="Price"
        className="border p-2 w-full"
        onChange={(e) => setPrice(e.target.value)}
      />

      <button className="bg-black text-white px-4 py-2 rounded">
        Save Hotel Booking
      </button>
    </form>
  );
}
