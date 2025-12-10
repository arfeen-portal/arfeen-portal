"use client";

import { useState } from "react";

export default function PassengerForm() {
  const [passengers, setPassengers] = useState([{ name: "", passport: "", dob: "", nationality: "" }]);

  const addPassenger = () => {
    setPassengers([...passengers, { name: "", passport: "", dob: "", nationality: "" }]);
  };

  return (
    <div className="bg-white shadow rounded p-4 mb-4 border border-gray-200">
      <h3 className="font-semibold text-lg mb-3 text-primary">Passenger Details</h3>

      {passengers.map((p, i) => (
        <div key={i} className="grid grid-cols-2 gap-3 mb-4">
          <input className="input" placeholder="Full Name" onChange={(e) => passengers[i].name = e.target.value}/>
          <input className="input" placeholder="Passport No." onChange={(e) => passengers[i].passport = e.target.value}/>
          <input className="input" type="date" onChange={(e) => passengers[i].dob = e.target.value}/>
          <input className="input" placeholder="Nationality" onChange={(e) => passengers[i].nationality = e.target.value}/>
        </div>
      ))}

      <button onClick={addPassenger} className="btn border px-4 py-2 rounded-full bg-primary text-white">
        + Add Passenger
      </button>
    </div>
  );
}
