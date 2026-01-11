"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
export default function UmrahPackageTransportForm({
  packageId,
}: {
  packageId: string;
}) {
  const router = useRouter();

  const [routeId, setRouteId] = useState("");
  const [direction, setDirection] = useState("transfer");
  const [sortOrder, setSortOrder] = useState("0");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("umrah_package_transports")
        .insert({
          package_id: packageId,
          route_id: routeId,
          direction,
          sort_order: Number(sortOrder) || 0,
          notes,
        })
        .select("id")
        .single();

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      router.push(`/umrah/packages/${packageId}/transports`);
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded">
      {errorMsg && (
        <div className="bg-red-50 text-red-700 border border-red-300 p-2 text-sm rounded">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold mb-1">
          Transport route ID
        </label>
        <input
          className="w-full border rounded px-2 py-1 text-sm"
          value={routeId}
          onChange={(e) => setRouteId(e.target.value)}
          placeholder="Paste transport route UUID"
          required
        />
        <p className="text-[10px] text-gray-500">
          (Later isko dropdown bana denge; abhi basic linking.)
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1">Direction</label>
        <select
          className="w-full border rounded px-2 py-1 text-sm"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
        >
          <option value="transfer">Transfer</option>
          <option value="arrival">Arrival</option>
          <option value="departure">Departure</option>
          <option value="internal">Internal (Ziyarat / city)</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1">Sort order</label>
        <input
          type="number"
          className="w-full border rounded px-2 py-1 text-sm"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1">Notes</label>
        <textarea
          className="w-full border rounded px-2 py-1 text-sm min-h-[60px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-3 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save transport link"}
      </button>
    </form>
  );
}
