"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type InvoiceLine = {
  description: string;
  qty: number;
  price: number;
};

type InvoiceForm = {
  customer_name: string;
  customer_phone: string;
  agent_name: string;
  agent_code: string;
  invoice_date: string;
  due_date: string;
  reference_no: string;
  notes: string;
};

const today = new Date().toISOString().slice(0, 10);

const emptyForm: InvoiceForm = {
  customer_name: "",
  customer_phone: "",
  agent_name: "",
  agent_code: "",
  invoice_date: today,
  due_date: "",
  reference_no: "",
  notes: "",
};

const money = (value: number) =>
  Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function StatusBadge() {
  return (
    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-wider text-indigo-600">
      Draft Mode
    </span>
  );
}

export default function NewInvoicePage() {
  const router = useRouter();

  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: "", qty: 1, price: 0 },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const subtotal = useMemo(
    () =>
      lines.reduce(
        (sum, line) => sum + Number(line.qty || 0) * Number(line.price || 0),
        0
      ),
    [lines]
  );

  const totalItems = useMemo(
    () => lines.reduce((sum, line) => sum + Number(line.qty || 0), 0),
    [lines]
  );

  function updateForm(key: keyof InvoiceForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateLine(index: number, key: keyof InvoiceLine, value: string) {
    setLines((prev) =>
      prev.map((line, i) =>
        i === index
          ? {
              ...line,
              [key]:
                key === "description"
                  ? value
                  : Math.max(Number(value || 0), 0),
            }
          : line
      )
    );
  }

  function addLine() {
    setLines((prev) => [...prev, { description: "", qty: 1, price: 0 }]);
  }

  function removeLine(index: number) {
    setLines((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    if (saving) return;

    setError("");

    if (!form.customer_name.trim()) {
      setError("Customer name required hai.");
      return;
    }

    const validLines = lines.filter(
      (line) => line.description.trim() && Number(line.qty) > 0
    );

    if (validLines.length === 0) {
      setError("Kam az kam aik invoice item add karein.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/accounts/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          ...form,
          status: "draft",
          total_amount: subtotal,
          lines: validLines.map((line, index) => ({
            sort_order: index + 1,
            description: line.description,
            qty: Number(line.qty || 0),
            unit_price: Number(line.price || 0),
            line_total: Number(line.qty || 0) * Number(line.price || 0),
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || "Invoice create nahi ho saki.");
      }

      router.push("/accounts/invoices");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Invoice save karte waqt error aa gaya.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        addLine();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSubmit();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [form, lines, subtotal, saving]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
            Accounts / New Invoice
          </p>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">
            Create Invoice
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create customer invoice with live totals and ledger-ready structure.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge />
          <Link
            href="/accounts/invoices"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Back
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-black text-slate-900">
              Invoice Details
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={form.customer_name}
                onChange={(e) => updateForm("customer_name", e.target.value)}
                placeholder="Customer Name *"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <input
                value={form.customer_phone}
                onChange={(e) => updateForm("customer_phone", e.target.value)}
                placeholder="Customer Phone"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <input
                value={form.agent_name}
                onChange={(e) => updateForm("agent_name", e.target.value)}
                placeholder="Agent Name"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <input
                value={form.agent_code}
                onChange={(e) => updateForm("agent_code", e.target.value)}
                placeholder="Agent Code"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <input
                type="date"
                value={form.invoice_date}
                onChange={(e) => updateForm("invoice_date", e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <input
                type="date"
                value={form.due_date}
                onChange={(e) => updateForm("due_date", e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />

              <input
                value={form.reference_no}
                onChange={(e) => updateForm("reference_no", e.target.value)}
                placeholder="Reference No"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 md:col-span-2"
              />
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">
                Invoice Items
              </h2>

              <button
                type="button"
                onClick={addLine}
                className="rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-600 hover:bg-indigo-100"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => {
                const lineTotal =
                  Number(line.qty || 0) * Number(line.price || 0);

                return (
                  <div
                    key={index}
                    className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 md:grid-cols-12"
                  >
                    <input
                      value={line.description}
                      onChange={(e) =>
                        updateLine(index, "description", e.target.value)
                      }
                      placeholder="Item description"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-300 md:col-span-5"
                    />

                    <input
                      type="number"
                      value={line.qty}
                      onChange={(e) => updateLine(index, "qty", e.target.value)}
                      placeholder="Qty"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-300 md:col-span-2"
                    />

                    <input
                      type="number"
                      value={line.price}
                      onChange={(e) =>
                        updateLine(index, "price", e.target.value)
                      }
                      placeholder="Price"
                      className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-indigo-300 md:col-span-2"
                    />

                    <div className="flex items-center justify-end rounded-xl bg-white px-3 py-3 font-mono text-sm font-black text-slate-900 md:col-span-2">
                      {money(lineTotal)}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="rounded-xl bg-white px-3 py-3 text-sm font-black text-red-500 hover:bg-red-50 md:col-span-1"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>

            <textarea
              value={form.notes}
              onChange={(e) => updateForm("notes", e.target.value)}
              placeholder="Internal notes..."
              className="mt-5 min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            />
          </div>
        </div>

        <div className="xl:col-span-4">
          <div className="sticky top-8 rounded-[2rem] bg-slate-950 p-7 text-white shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
              Invoice Summary
            </p>

            <h2 className="mt-3 text-5xl font-black tracking-tight">
              PKR {money(subtotal)}
            </h2>

            <div className="mt-8 space-y-4 rounded-2xl bg-white/5 p-5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Items</span>
                <span className="font-black">{totalItems}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Invoice Date</span>
                <span className="font-black">{form.invoice_date || "—"}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Due Date</span>
                <span className="font-black">{form.due_date || "—"}</span>
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex justify-between text-base">
                  <span className="text-slate-300">Grand Total</span>
                  <span className="font-black">PKR {money(subtotal)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-400">
              <p className="font-black text-slate-300">Keyboard Shortcuts</p>
              <p className="mt-2">Alt + N = Add item</p>
              <p>Ctrl + S = Save invoice</p>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="mt-6 w-full rounded-2xl bg-indigo-600 py-4 text-sm font-black text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Draft Invoice"}
            </button>

            <p className="mt-4 text-center text-xs text-slate-400">
              Invoice save hone ke baad ledger/accounting route se posting handle hogi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}