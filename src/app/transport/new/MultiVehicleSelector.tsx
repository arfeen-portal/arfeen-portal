"use client";

import { useState } from "react";

const VEHICLE_TYPES = ["GMC", "H1", "Coaster", "Hiace"];

export type MultiVehicleSelection = {
  vehicleType: string;
  quantity: number;
};

type Props = {
  onChange: (rows: MultiVehicleSelection[]) => void;
};

export default function MultiVehicleSelector({ onChange }: Props) {
  const [rows, setRows] = useState<MultiVehicleSelection[]>([
    { vehicleType: "GMC", quantity: 1 },
  ]);

  const update = (next: MultiVehicleSelection[]) => {
    setRows(next);
    onChange(next);
  };

  return (
    <div className="border rounded-xl p-3 mt-3 bg-white">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-xs">Multi Vehicle Booking</h3>
        <button
          type="button"
          className="text-xs underline"
          onClick={() =>
            update([...rows, { vehicleType: "GMC", quantity: 1 }])
          }
        >
          + Add Vehicle
        </button>
      </div>
      <div className="space-y-2 text-xs">
        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-2">
            <select
              className="border rounded px-2 py-1 flex-1"
              value={row.vehicleType}
              onChange={(e) => {
                const copy = [...rows];
                copy[idx].vehicleType = e.target.value;
                update(copy);
              }}
            >
              {VEHICLE_TYPES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              className="border rounded px-2 py-1 w-20"
              value={row.quantity}
              onChange={(e) => {
                const copy = [...rows];
                copy[idx].quantity = Number(e.target.value || 1);
                update(copy);
              }}
            />
            <button
              type="button"
              className="text-xs text-red-500"
              onClick={() => update(rows.filter((_, i) => i !== idx))}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
