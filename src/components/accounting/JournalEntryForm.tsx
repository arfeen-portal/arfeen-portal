"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Account = {
  id: string;
  code: string;
  name: string;
  account_type?: string;
};

type FormLine = {
  account_id: string;
  line_description: string;
  debit: string;
  credit: string;
};

type Props = {
  mode: "create" | "edit";
  entryId?: string;
  initialData?: {
    entry: {
      entry_date: string;
      posting_date: string;
      description: string | null;
      reference_no: string | null;
      status: "draft" | "posted" | "cancelled";
    };
    lines: Array<{
      account_id: string;
      line_description: string | null;
      debit: number;
      credit: number;
    }>;
  };
};

function money(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function JournalEntryForm({
  mode,
  entryId,
  initialData,
}: Props) {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [entryDate, setEntryDate] = useState(
    initialData?.entry?.entry_date?.slice(0, 10) ||
      new Date().toISOString().slice(0, 10)
  );
  const [postingDate, setPostingDate] = useState(
    initialData?.entry?.posting_date?.slice(0, 10) ||
      new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState(initialData?.entry?.description || "");
  const [referenceNo, setReferenceNo] = useState(initialData?.entry?.reference_no || "");
  const [status, setStatus] = useState<"draft" | "posted" | "cancelled">(
    initialData?.entry?.status || "posted"
  );

  const [lines, setLines] = useState<FormLine[]>(
    initialData?.lines?.length
      ? initialData.lines.map((line) => ({
          account_id: line.account_id,
          line_description: line.line_description || "",
          debit: line.debit ? String(line.debit) : "",
          credit: line.credit ? String(line.credit) : "",
        }))
      : [
          { account_id: "", line_description: "", debit: "", credit: "" },
          { account_id: "", line_description: "", debit: "", credit: "" },
        ]
  );

  useEffect(() => {
    let ignore = false;

    async function loadMeta() {
      try {
        const res = await fetch("/api/accounting/meta", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load accounts");
        if (!ignore) setAccounts(json.accounts || []);
      } catch (e) {
        if (!ignore) setError(e instanceof Error ? e.message : "Failed to load meta");
      }
    }

    loadMeta();
    return () => {
      ignore = true;
    };
  }, []);

  const totals = useMemo(() => {
    const debit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const credit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    return { debit, credit, balanced: debit === credit && debit > 0 };
  }, [lines]);

  function updateLine(index: number, field: keyof FormLine, value: string) {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;

        if (field === "debit") {
          return { ...line, debit: value, credit: value ? "" : line.credit };
        }
        if (field === "credit") {
          return { ...line, credit: value, debit: value ? "" : line.debit };
        }

        return { ...line, [field]: value };
      })
    );
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { account_id: "", line_description: "", debit: "", credit: "" },
    ]);
  }

  function removeLine(index: number) {
    setLines((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    try {
      setLoading(true);
      setError("");

      const payload = {
        entry_date: entryDate,
        posting_date: postingDate,
        description,
        reference_no: referenceNo,
        status,
        source: "journal",
        voucher_type: null,
        lines: lines.map((line) => ({
          account_id: line.account_id,
          line_description: line.line_description,
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
        })),
      };

      const res = await fetch(
        mode === "create" ? "/api/accounting/journal" : `/api/accounting/journal/${entryId}`,
        {
          method: mode === "create" ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");

      router.push(`/accounts/journal/${json.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === "create" ? "New Journal Entry" : "Edit Journal Entry"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Double-entry posting with balanced debit and credit validation.
            </p>
          </div>

          <div
            className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
              totals.balanced
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
            }`}
          >
            {totals.balanced ? "Balanced" : "Not Balanced"}
          </div>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Entry Date</label>
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Posting Date</label>
            <input
              type="date"
              value={postingDate}
              onChange={(e) => setPostingDate(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Reference No</label>
            <input
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="INV-1001 / BILL-24 / MANUAL"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "posted" | "cancelled")}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-slate-900"
            >
              <option value="posted">Posted</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Narration / reason / transaction summary"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Journal Lines</h2>
              <p className="text-sm text-slate-500">At least two lines are required.</p>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              + Add Line
            </button>
          </div>
        </div>

        <div className="hidden grid-cols-12 gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
          <div className="col-span-4">Account</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-2">Debit</div>
          <div className="col-span-2">Credit</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="space-y-3 p-4 lg:p-6">
          {lines.map((line, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-12"
            >
              <div className="lg:col-span-4">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                  Account
                </label>
                <select
                  value={line.account_id}
                  onChange={(e) => updateLine(index, "account_id", e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                >
                  <option value="">Select account</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                  Description
                </label>
                <input
                  value={line.line_description}
                  onChange={(e) => updateLine(index, "line_description", e.target.value)}
                  placeholder="Line narration"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                  Debit
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.debit}
                  onChange={(e) => updateLine(index, "debit", e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 lg:hidden">
                  Credit
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.credit}
                  onChange={(e) => updateLine(index, "credit", e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
                />
              </div>

              <div className="flex items-end justify-end lg:col-span-1">
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="rounded-2xl border border-red-200 px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-500">Total Debit</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{money(totals.debit)}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-500">Total Credit</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{money(totals.credit)}</div>
            </div>
            <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="text-xs uppercase tracking-wide text-slate-500">Difference</div>
              <div className={`mt-1 text-xl font-bold ${totals.debit === totals.credit ? "text-emerald-600" : "text-red-600"}`}>
                {money(Math.abs(totals.debit - totals.credit))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/accounts/journal")}
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : mode === "create" ? "Create Entry" : "Update Entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}