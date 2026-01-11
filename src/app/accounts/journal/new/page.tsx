"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Account = {
  id: string;
  code: string;
  name: string;
};

type Line = {
  accountId: string;
  description: string;
  debit: string;
  credit: string;
};

export default function NewJournalEntryPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const router = useRouter();

  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [sourceModule, setSourceModule] = useState("manual");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [lines, setLines] = useState<Line[]>([
    { accountId: "", description: "", debit: "", credit: "" },
    { accountId: "", description: "", debit: "", credit: "" },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase
        .from("acc_accounts")
        .select("id,code,name")
        .order("code", { ascending: true });

      if (error) {
        console.error(error);
      } else {
        setAccounts((data || []) as Account[]);
      }
    };

    fetchAccounts();
  }, [supabase]);

  const totalDebit = lines.reduce(
    (sum, l) => sum + Number(l.debit || 0),
    0
  );
  const totalCredit = lines.reduce(
    (sum, l) => sum + Number(l.credit || 0),
    0
  );

  const balanced = Math.abs(totalDebit - totalCredit) < 0.001;

  const handleLineChange = (index: number, field: keyof Line, value: string) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { accountId: "", description: "", debit: "", credit: "" },
    ]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!balanced) {
      setErrorMsg("Debit and Credit must be equal.");
      return;
    }

    const validLines = lines.filter(
      (l) =>
        l.accountId &&
        (Number(l.debit || 0) !== 0 || Number(l.credit || 0) !== 0)
    );

    if (validLines.length === 0) {
      setErrorMsg("At least one line is required.");
      return;
    }

    setSaving(true);

    const { data: header, error: headerError } = await supabase
      .from("acc_journal_entries")
      .insert({
        entry_date: entryDate,
        description,
        reference,
        source_module: sourceModule,
      })
      .select("id")
      .single();

    if (headerError || !header) {
      console.error(headerError);
      setErrorMsg(headerError?.message || "Failed to save entry.");
      setSaving(false);
      return;
    }

    const linesPayload = validLines.map((l, index) => ({
      journal_entry_id: header.id,
      line_no: index + 1,
      account_id: l.accountId,
      description: l.description || description,
      debit: Number(l.debit || 0),
      credit: Number(l.credit || 0),
      currency_code: "SAR",
      fx_rate: 1,
    }));

    const { error: linesError } = await supabase
      .from("acc_journal_entry_lines")
      .insert(linesPayload);

    if (linesError) {
      console.error(linesError);
      setErrorMsg(linesError.message);
      setSaving(false);
      return;
    }

    router.push("/accounts/journal");
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">New Journal Entry</h1>
        <p className="text-sm text-gray-500">
          Balanced debit / credit posting.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">
              Date
            </label>
            <input
              type="date"
              className="border rounded px-3 py-2 text-sm"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Reference
            </label>
            <input
              className="border rounded px-3 py-2 text-sm"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Source
            </label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={sourceModule}
              onChange={(e) => setSourceModule(e.target.value)}
            >
              <option value="manual">Manual</option>
              <option value="transport">Transport</option>
              <option value="umrah">Umrah</option>
              <option value="flight">Flight</option>
              <option value="hotel">Hotel</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">
            Description
          </label>
          <input
            className="border rounded px-3 py-2 text-sm w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Account</th>
                <th className="px-3 py-2 text-left">Line Description</th>
                <th className="px-3 py-2 text-right">Debit</th>
                <th className="px-3 py-2 text-right">Credit</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, index) => (
                <tr key={index} className="border-t">
                  <td className="px-3 py-2">
                    <select
                      className="border rounded px-2 py-1 text-xs sm:text-sm min-w-[160px]"
                      value={l.accountId}
                      onChange={(e) =>
                        handleLineChange(index, "accountId", e.target.value)
                      }
                    >
                      <option value="">Select account…</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code} – {a.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="border rounded px-2 py-1 text-xs sm:text-sm w-full"
                      value={l.description}
                      onChange={(e) =>
                        handleLineChange(index, "description", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      className="border rounded px-2 py-1 text-xs sm:text-sm w-24 text-right"
                      value={l.debit}
                      onChange={(e) =>
                        handleLineChange(index, "debit", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      className="border rounded px-2 py-1 text-xs sm:text-sm w-24 text-right"
                      value={l.credit}
                      onChange={(e) =>
                        handleLineChange(index, "credit", e.target.value)
                      }
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="text-xs text-red-500"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={2} className="px-3 py-2 text-right font-semibold">
                  Totals
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {totalDebit.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {totalCredit.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {!balanced && (
                    <span className="text-[10px] text-red-500">
                      Not balanced
                    </span>
                  )}
                  {balanced && (
                    <span className="text-[10px] text-green-600">
                      Balanced
                    </span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-500">{errorMsg}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={addLine}
            className="px-3 py-2 text-sm rounded border"
          >
            + Add Line
          </button>
          <button
            type="submit"
            disabled={saving || !balanced}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Entry"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm rounded border"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
