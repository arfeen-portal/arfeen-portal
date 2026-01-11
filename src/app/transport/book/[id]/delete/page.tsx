"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
export default function DeleteBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("transport_bookings")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/transport/book");
  };

  return (
    <div className="p-6 space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">Delete Booking</h1>
      <p className="text-sm">
        Kya aap waqai ye booking delete karna chahte hain? Ye action wapas nahi
        aayega.
      </p>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => router.push(`/transport/book/${id}`)}
          className="rounded border px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded bg-red-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? "Deleting..." : "Yes, delete"}
        </button>
      </div>
    </div>
  );
}
