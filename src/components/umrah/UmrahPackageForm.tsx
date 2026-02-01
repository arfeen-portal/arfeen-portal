"use client";

import { useState } from "react";
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

import { useRouter } from "next/navigation";
export default function UmrahPackageForm({ existing }: any) {
  const router = useRouter();

  const [name, setName] = useState(existing?.name || "");
  const [code, setCode] = useState(existing?.code || "");
  const [description, setDescription] = useState(existing?.description || "");
  const [isActive, setIsActive] = useState(existing?.is_active ?? true);

  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMessage("");

    const payload = {
      name,
      code: code?.trim() === "" ? null : code.trim(),
      description,
      is_active: isActive,
    };

    let result;

    try {
      if (existing) {
        result = await supabase
          .from("umrah_packages")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("umrah_packages")
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) {
        setErrorMessage(result.error.message);
        return;
      }

      router.push("/umrah/packages");
    } catch (error: any) {
      setErrorMessage(error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Error message */}
      {errorMessage && (
        <div className="p-3 bg-red-100 text-red-700 border border-red-400 rounded">
          {errorMessage}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="font-semibold">Package name *</label>
        <input
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      {/* Code */}
      <div>
        <label className="font-semibold">Code (optional)</label>
        <input
          className="w-full p-2 border rounded"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="PKG-15-MAKKAH-MED"
        />
      </div>

      {/* Description */}
      <div>
        <label className="font-semibold">Description</label>
        <textarea
          className="w-full p-2 border rounded min-h-[120px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short summary…"
        />
      </div>

      {/* Active */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <label>Active package (visible for selection)</label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        Save package
      </button>
    </form>
  );
}
