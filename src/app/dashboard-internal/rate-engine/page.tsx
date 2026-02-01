"use client";

import { useState } from "react";
import PassengerForm from "@/components/PassengerForm";

export default function RateEnginePage() {
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [routes, setRoute] = useState("");
  const [travelDate, setTravelDate] = useState("");

  const search = () => {
    window.location.href = `/search?city=${city}&checkIn=${checkIn}&checkOut=${checkOut}&route=${routes}&travel=${travelDate}`;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="font-bold text-2xl text-primary mb-6">Hotel & Flight Rate Engine</h1>

      <div className="grid grid-cols-2 gap-4">
        <select onChange={(e) => setCity(e.target.value)} className="input">
          <option value="">Select City</option>
          <option value="Makkah">Makkah</option>
          <option value="Madinah">Madinah</option>
          <option value="Jeddah">Jeddah</option>
        </select>

        <input type="date" className="input" onChange={(e) => setCheckIn(e.target.value)}/>
        <input type="date" className="input" onChange={(e) => setCheckOut(e.target.value)}/>

        <input placeholder="Flight Route (JED → MED)" className="input" onChange={(e) => setRoute(e.target.value)}/>
        <input type="date" className="input" onChange={(e) => setTravelDate(e.target.value)}/>
      </div>

      <PassengerForm />

      <button onClick={search} className="btn bg-primary text-white px-6 py-3 rounded-xl mt-4 w-full">
        🔎 Search Best Rates
      </button>
    </div>
  );
}
