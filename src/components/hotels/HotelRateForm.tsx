"use client";
import { useState } from "react";

export default function HotelRateForm({ onSubmit }: any) {
  const [hotelName, setHotelName] = useState("");
  const [roomType, setRoomType] = useState("");
  const [price, setPrice] = useState("");

  function handleSubmit(e: any) {
    e.preventDefault();
    onSubmit({ hotelName, roomType, price });
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
        placeholder="Room Type"
        className="border p-2 w-full"
        onChange={(e) => setRoomType(e.target.value)}
      />

      <input
        type="number"
        placeholder="Price"
        className="border p-2 w-full"
        onChange={(e) => setPrice(e.target.value)}
      />

      <button className="bg-black text-white px-4 py-2 rounded">
        Save Rate
      </button>
    </form>
  );
}
