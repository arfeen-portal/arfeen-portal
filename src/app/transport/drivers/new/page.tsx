"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NewDriverPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setSaving(true);
    setError(null);

    const { error } = await supabase.from("transport_drivers").insert({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      whatsapp: whatsapp.trim() || null,
      license_number: licenseNumber.trim() || null,
      notes: notes.trim() || null,
      is_active: isActive,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/transport/drivers");
  };

  return (
    <div className="max-w-xl space-y-4 p-6">
      <button
        type="button"
        onClick={() => router.push("/transport/drivers")}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        ← Back to drivers
      </button>

      <h1 className="text-xl font-semibold">New Driver</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-white p-4 shadow-sm"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Full name *
          </label>
          <input
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Phone
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              WhatsApp
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600">
            License number
          </label>
          <input
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Notes
          </label>
          <textarea
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label
            htmlFor="isActive"
            className="text-xs font-semibold text-gray-600"
          >
            Active
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push("/transport/drivers")}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save driver"}
          </button>
        </div>
      </form>
    </div>
  );
}
