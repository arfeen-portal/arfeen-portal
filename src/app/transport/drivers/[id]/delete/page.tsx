"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DeleteDriverPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("transport_drivers")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/transport/drivers");
  };

  return (
    <div className="max-w-xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Delete Driver</h1>
      <p className="text-sm">
        Kya aap waqai is driver ko delete karna chahte hain? Ye action wapas
        nahi aa sakta.
      </p>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.push("/transport/drivers")}
          className="rounded border px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
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
