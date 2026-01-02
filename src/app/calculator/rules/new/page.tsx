"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";

type ItemRow = {
  id: number;
  minPax: string;
  maxPax: string;
  minNights: string;
  maxNights: string;
  basePrice: string;
  perNightAdd: string;
};

export default function NewCalculatorRulePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<ItemRow[]>([
    { id: 1, minPax: "1", maxPax: "2", minNights: "7", maxNights: "15", basePrice: "0", perNightAdd: "0" },
  ]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        minPax: "",
        maxPax: "",
        minNights: "",
        maxNights: "",
        basePrice: "",
        perNightAdd: "",
      },
    ]);
  };

  const updateRow = (id: number, field: keyof ItemRow, value: string) => {
    setItems((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeRow = (id: number) => {
    setItems((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const { data: rule, error } = await supabase
      .from("umrah_calculator_rules")
      .insert({
        name,
        description,
        is_active: isActive,
      })
      .select("id")
      .single();

    if (error || !rule) {
      setSaving(false);
      setErrorMsg(error?.message || "Failed to save rule.");
      return;
    }

    const itemsPayload = items
      .filter((i) => i.minPax && i.maxPax && i.basePrice)
      .map((i) => ({
        rule_id: rule.id,
        min_pax: Number(i.minPax || 0),
        max_pax: Number(i.maxPax || 0),
        min_nights: Number(i.minNights || 0),
        max_nights: Number(i.maxNights || 0),
        base_price: Number(i.basePrice || 0),
        per_night_add: Number(i.perNightAdd || 0),
      }));

    if (itemsPayload.length) {
      const { error: itemsError } = await supabase
        .from("umrah_calculator_rule_items")
        .insert(itemsPayload);

      if (itemsError) {
        setSaving(false);
        setErrorMsg(itemsError.message);
        return;
      }
    }

    router.push("/calculator/rules");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <a href="/calculator/rules" className="text-blue-600 text-sm">
        &larr; Back to rules
      </a>

      <h1 className="text-2xl font-bold">New Calculator Rule</h1>

      <form
        onSubmit={handleSubmit}
        className="border rounded p-4 space-y-4 bg-white"
      >
        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-2 text-sm">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1">
            Rule name *
          </label>
          <input
            className="border rounded w-full p-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Default Saudi Family Rule"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Description
          </label>
          <textarea
            className="border rounded w-full p-2 text-sm"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short explanation for your own reference"
          />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>Active rule</span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-sm">
              Pax / Nights bands (price matrix)
            </h2>
            <button
              type="button"
              onClick={addRow}
              className="text-xs px-2 py-1 border rounded"
            >
              + Add band
            </button>
          </div>

          <div className="border rounded overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-2 py-1">Min pax</th>
                  <th className="px-2 py-1">Max pax</th>
                  <th className="px-2 py-1">Min nights</th>
                  <th className="px-2 py-1">Max nights</th>
                  <th className="px-2 py-1">Base price</th>
                  <th className="px-2 py-1">Per night add</th>
                  <th className="px-2 py-1"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-2 py-1">
                      <input
                        className="border rounded w-full px-1 py-0.5"
                        value={row.minPax}
                        onChange={(e) =>
                          updateRow(row.id, "minPax", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="border rounded w-full px-1 py-0.5"
                        value={row.maxPax}
                        onChange={(e) =>
                          updateRow(row.id, "maxPax", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="border rounded w-full px-1 py-0.5"
                        value={row.minNights}
                        onChange={(e) =>
                          updateRow(row.id, "minNights", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="border rounded w-full px-1 py-0.5"
                        value={row.maxNights}
                        onChange={(e) =>
                          updateRow(row.id, "maxNights", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="border rounded w-full px-1 py-0.5"
                        value={row.basePrice}
                        onChange={(e) =>
                          updateRow(row.id, "basePrice", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        className="border rounded w-full px-1 py-0.5"
                        value={row.perNightAdd}
                        onChange={(e) =>
                          updateRow(row.id, "perNightAdd", e.target.value)
                        }
                      />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-red-600"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}

                {!items.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-2 py-2 text-center text-gray-500"
                    >
                      No bands – add at least one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save rule"}
        </button>
      </form>
    </div>
  );
}
