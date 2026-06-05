"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Account = { id: string; code: string; name: string };
type Line = { account_id: string; debit: number; credit: number; desc: string };

const emptyLine: Line = { account_id: "", debit: 0, credit: 0, desc: "" };

function AccountCombobox({
  accounts,
  value,
  onChange,
  inputRef,
}: {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
  inputRef?: (el: HTMLInputElement | null) => void;
}) {
  const selected = accounts.find((a) => a.id === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return accounts.slice(0, 30);

    return accounts
      .filter(
        (a) =>
          a.code?.toLowerCase().includes(q) ||
          a.name?.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [accounts, query]);

  return (
    <div className="relative col-span-3">
      <input
        ref={inputRef}
        value={open ? query : selected ? `${selected.code} — ${selected.name}` : ""}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        placeholder="Search account code/name"
        className="w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm outline-none focus:border-amber-300"
      />

      {open && (
        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-slate-400">No account found</div>
          ) : (
            filtered.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(acc.id);
                  setOpen(false);
                  setQuery("");
                }}
                className="block w-full border-b border-white/5 px-4 py-3 text-left text-sm hover:bg-amber-400/10"
              >
                <span className="font-black text-amber-300">{acc.code}</span>
                <span className="ml-2 text-slate-200">{acc.name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function JournalEntryPage() {
  const router = useRouter();
  const accountRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState("");

  const [header, setHeader] = useState({
    date: new Date().toISOString().split("T")[0],
    desc: "",
    ref: "",
  });

  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }, { ...emptyLine }]);

  const totals = useMemo(() => {
    return lines.reduce(
      (acc, l) => ({
        debit: acc.debit + Number(l.debit || 0),
        credit: acc.credit + Number(l.credit || 0),
      }),
      { debit: 0, credit: 0 }
    );
  }, [lines]);

  const difference = Number((totals.debit - totals.credit).toFixed(2));
  const isBalanced = Math.abs(difference) <= 0.01 && totals.debit > 0;

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        saveJournal();
      }
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        addLine();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  });

  async function fetchAccounts() {
    try {
      setLoadingAccounts(true);
      const res = await fetch("/api/accounts/journal-entry", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Accounts loading failed.");
      setAccounts(data.accounts || []);
    } catch (err: any) {
      setError(err?.message || "Unable to load accounts.");
    } finally {
      setLoadingAccounts(false);
    }
  }

  function updateLine(index: number, field: keyof Line, value: string) {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;

        if (field === "debit") return { ...line, debit: Number(value || 0), credit: 0 };
        if (field === "credit") return { ...line, credit: Number(value || 0), debit: 0 };

        return { ...line, [field]: value };
      })
    );
  }

  function addLine() {
    setLines((prev) => {
      const next = [...prev, { ...emptyLine }];
      setTimeout(() => accountRefs.current[next.length - 1]?.focus(), 50);
      return next;
    });
  }

  function removeLine(index: number) {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function autoBalanceLine(index: number) {
    const diff = Number((totals.debit - totals.credit).toFixed(2));
    if (diff === 0) return;

    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        if (diff > 0) return { ...line, debit: 0, credit: Math.abs(diff) };
        return { ...line, debit: Math.abs(diff), credit: 0 };
      })
    );
  }

  async function saveJournal() {
    setError("");

    if (!isBalanced) {
      setError("Debit aur Credit equal hone chahiye.");
      return;
    }

    const invalid = lines.some(
      (l) => !l.account_id && (Number(l.debit) > 0 || Number(l.credit) > 0)
    );

    if (invalid) {
      setError("Har debit/credit line ke liye account select karna zaroori hai.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/accounts/journal-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ header, lines }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Journal save failed.");

      router.push("/accounts/journal");
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-300">
                Arfeen Travel Accounts
              </p>
              <h1 className="mt-2 text-3xl font-black">Unified Journal Entry</h1>
              <p className="mt-1 text-sm text-slate-400">
                Searchable account posting, smart balancing, and keyboard-first workflow.
              </p>
            </div>

            <div
              className={`rounded-2xl px-5 py-3 text-sm font-black ${
                isBalanced
                  ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                  : "border border-red-400/30 bg-red-500/10 text-red-300"
              }`}
            >
              {isBalanced
                ? `Balanced: PKR ${totals.debit.toLocaleString()}`
                : `Difference: PKR ${Math.abs(difference).toLocaleString()}`}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-400">
            <span className="rounded-full border border-white/10 px-3 py-1">Ctrl + Enter = Post</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Alt + N = Add Line</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Search by account code/name</span>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 md:grid-cols-3">
          <div>
            <label className="text-xs font-bold uppercase text-slate-400">Date</label>
            <input
              type="date"
              value={header.date}
              onChange={(e) => setHeader({ ...header, date: e.target.value })}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 outline-none focus:border-amber-300"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-400">Reference</label>
            <input
              value={header.ref}
              onChange={(e) => setHeader({ ...header, ref: e.target.value })}
              placeholder="JV-0001"
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 outline-none focus:border-amber-300"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-400">Description</label>
            <input
              value={header.desc}
              onChange={(e) => setHeader({ ...header, desc: e.target.value })}
              placeholder="Journal narration"
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 outline-none focus:border-amber-300"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
          <div className="grid grid-cols-12 gap-3 border-b border-white/10 bg-slate-900/80 p-4 text-xs font-black uppercase text-slate-400">
            <div className="col-span-3">Account</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2 text-right">Debit</div>
            <div className="col-span-2 text-right">Credit</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          {loadingAccounts && (
            <div className="p-4 text-sm font-bold text-amber-300">Loading accounts...</div>
          )}

          <div className="divide-y divide-white/10">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 p-4">
                <AccountCombobox
                  accounts={accounts}
                  value={line.account_id}
                  onChange={(id) => updateLine(idx, "account_id", id)}
                  inputRef={(el) => {
                    accountRefs.current[idx] = el;
                  }}
                />

                <input
                  value={line.desc}
                  onChange={(e) => updateLine(idx, "desc", e.target.value)}
                  placeholder="Line narration"
                  className="col-span-3 rounded-xl border border-white/10 bg-slate-900 p-3 text-sm outline-none focus:border-amber-300"
                />

                <input
                  type="number"
                  value={line.debit || ""}
                  onChange={(e) => updateLine(idx, "debit", e.target.value)}
                  placeholder="0"
                  className="col-span-2 rounded-xl border border-white/10 bg-slate-900 p-3 text-right text-sm outline-none focus:border-amber-300"
                />

                <input
                  type="number"
                  value={line.credit || ""}
                  onChange={(e) => updateLine(idx, "credit", e.target.value)}
                  placeholder="0"
                  className="col-span-2 rounded-xl border border-white/10 bg-slate-900 p-3 text-right text-sm outline-none focus:border-amber-300"
                />

                <div className="col-span-2 flex gap-2">
                  <button
                    onClick={() => autoBalanceLine(idx)}
                    className="flex-1 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-black text-amber-300"
                  >
                    Balance
                  </button>

                  <button
                    onClick={() => removeLine(idx)}
                    disabled={lines.length <= 2}
                    className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-black text-red-300 disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 bg-slate-900/70 p-5 md:flex-row md:items-center md:justify-between">
            <button
              onClick={addLine}
              className="rounded-xl bg-amber-400 px-6 py-3 text-sm font-black text-slate-950 hover:bg-amber-300"
            >
              + Add Line
            </button>

            <div className="grid gap-2 text-right text-sm">
              <div className="font-bold text-slate-300">
                Total Debit: PKR {totals.debit.toLocaleString()}
              </div>
              <div className="font-bold text-slate-300">
                Total Credit: PKR {totals.credit.toLocaleString()}
              </div>
              <div className={isBalanced ? "font-black text-emerald-300" : "font-black text-red-300"}>
                {isBalanced ? "Ready to Post" : "Not Balanced"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={saveJournal}
            disabled={!isBalanced || saving}
            className="rounded-2xl bg-emerald-400 px-8 py-4 text-sm font-black text-slate-950 shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Posting..." : "Post Journal Entry"}
          </button>

          <p className="text-xs font-semibold text-slate-400">
            Entry will be posted to General Ledger.
          </p>
        </div>
      </div>
    </div>
  );
}