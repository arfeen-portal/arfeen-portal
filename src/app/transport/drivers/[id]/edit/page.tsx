"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type FormState = {
  full_name: string;
  phone: string;
  whatsapp: string;
  license_number: string;
  notes: string;
  is_active: boolean;
};

export default function EditDriverPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      const { data, error } = await supabase
        .from("transport_drivers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setForm({
        full_name: data.full_name || "",
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
        license_number: data.license_number || "",
        notes: data.notes || "",
        is_active: data.is_active ?? true,
      });
      setLoading(false);
    };

    load();
  }, [id]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) =>
      prev
        ? {
            ...prev,
            [name]: type === "checkbox" ? checked : value,
          }
        : prev
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || !id) return;

    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("transport_drivers")
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        license_number: form.license_number.trim() || null,
        notes: form.notes.trim() || null,
        is_active: form.is_active,
      })
      .eq("id", id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/transport/drivers");
  };

  if (loading || !form) {
    return <div className="p-4 text-sm">Loading driver...</div>;
  }

  return (
    <div className="max-w-xl space-y-4 p-6">
      <button
        onClick={() => router.push("/transport/drivers")}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        ← Back to drivers
      </button>

      <h1 className="text-xl font-semibold">Edit Driver</h1>

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
            name="full_name"
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={form.full_name}
            onChange={onChange}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Phone
            </label>
            <input
              name="phone"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={form.phone}
              onChange={onChange}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              WhatsApp
            </label>
            <input
              name="whatsapp"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={form.whatsapp}
              onChange={onChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600">
            License number
          </label>
          <input
            name="license_number"
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={form.license_number}
            onChange={onChange}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Notes
          </label>
          <textarea
            name="notes"
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            rows={2}
            value={form.notes}
            onChange={onChange}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="driverActiveEdit"
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={onChange}
          />
          <label
            htmlFor="driverActiveEdit"
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
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
