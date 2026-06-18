"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type InvoiceItem = {
  id: string;
  description: string;
  qty: number;
  rate: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeStatus(status: string) {
  return String(status || "draft").toLowerCase().trim().replace(/\s+/g, "_");
}

function InvoiceFormContent() {
  const searchParams = useSearchParams();

  const bookingId = searchParams.get("booking_id");
  const bookingType = searchParams.get("booking_type") || "transport";

  const [loading, setLoading] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const [invoiceNo, setInvoiceNo] = useState("Auto Generated");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [status, setStatus] = useState("draft");
  const [notes, setNotes] = useState("Thank you for choosing Arfeen Travel.");
  const [taxPct, setTaxPct] = useState(0);
  const [discount, setDiscount] = useState(0);

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: makeId(), description: "", qty: 1, rate: 0 },
  ]);

  useEffect(() => {
    async function populateFromBooking() {
      if (!bookingId) return;

      try {
        setLoading(true);

        const res = await fetch("/api/accounts/invoices/create-from-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_id: bookingId,
            booking_type: bookingType,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Booking invoice creation failed.");
        }

        if (data.invoice) {
          const invoice = data.invoice;

          setInvoiceId(invoice.id || null);
          setInvoiceNo(invoice.invoice_no || "Auto Generated");
          setCustomerName(invoice.customer_name || "");
          setCustomerPhone(invoice.customer_phone || "");
          setStatus(normalizeStatus(invoice.status || "draft"));
          setNotes(invoice.notes || `Auto-created from ${bookingType} booking.`);

          const subtotal = Number(invoice.subtotal || invoice.total_amount || 0);
          const taxAmount = Number(invoice.tax_amount || 0);
          const grandTotal = Number(invoice.grand_total || invoice.total_amount || 0);

          setTaxPct(subtotal > 0 ? Math.round((taxAmount / subtotal) * 100) : 0);
          setDiscount(Number(invoice.discount_amount || 0));

          setItems([
            {
              id: makeId(),
              description: `${bookingType.toUpperCase()} Booking Fulfillment Component`,
              qty: 1,
              rate: subtotal || grandTotal || 0,
            },
          ]);
        }
      } catch (err: any) {
        alert(err?.message || "Invoice integration failed.");
      } finally {
        setLoading(false);
      }
    }

    populateFromBooking();
  }, [bookingId, bookingType]);

  const isCancelled = normalizeStatus(status) === "cancelled";

  const subTotal = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0), 0),
    [items]
  );

  const taxAmount = useMemo(() => (subTotal * Number(taxPct || 0)) / 100, [
    subTotal,
    taxPct,
  ]);

  const grandTotal = useMemo(
    () => Math.max(subTotal + taxAmount - Number(discount || 0), 0),
    [subTotal, taxAmount, discount]
  );

  function updateItem(id: string, key: keyof InvoiceItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]: key === "description" ? String(value) : Math.max(Number(value || 0), 0),
            }
          : item
      )
    );
  }

  function addLine() {
    setItems((prev) => [
      ...prev,
      { id: makeId(), description: "", qty: 1, rate: 0 },
    ]);
  }

  function removeLine(id: string) {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== id);
      return next.length ? next : [{ id: makeId(), description: "", qty: 1, rate: 0 }];
    });
  }

  // Sync with /api/accounts/invoices/[id]/cancel endpoint standard mapping.
  async function handleCancelInvoice() {
    if (!invoiceId) {
      alert("Only saved invoice can be cancelled.");
      return;
    }

    const reason = prompt("Cancellation reason likhein:");

    if (reason === null) return;

    if (!reason.trim()) {
      alert("Cancellation reason required hai.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/accounts/invoices/${invoiceId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invoice cancellation failed.");
      }

      setStatus("cancelled");
      alert("Invoice cancelled successfully.");
    } catch (err: any) {
      alert(err?.message || "Invoice cancellation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function saveInvoice() {
    if (isCancelled) {
      alert("Cancelled invoice modify nahi ho sakti.");
      return;
    }

    if (!customerName.trim()) {
      alert("Customer Name empty nahi chor sakte.");
      return;
    }

    const validItems = items.filter(i => i.description.trim() !== "");
    if (validItems.length === 0) {
      alert("Kam se kam ek invoice item ka description hona lazmi hai.");
      return;
    }

    const payload = {
      invoice_no: invoiceNo === "Auto Generated" ? undefined : invoiceNo,
      invoice_date: invoiceDate,
      due_date: dueDate,
      customer_name: customerName,
      customer_phone: customerPhone,
      billing_address: billingAddress,
      status: normalizeStatus(status),
      notes,
      tax_pct: taxPct,
      discount,
      subtotal: subTotal,
      tax_amount: taxAmount,
      discount_amount: discount,
      total_amount: grandTotal,
      grand_total: grandTotal,
      balance_amount: grandTotal,
      items: validItems,
    };

    try {
      setLoading(true);

      const url = invoiceId
        ? `/api/accounts/invoices/${invoiceId}`
        : "/api/accounts/invoices";

      const res = await fetch(url, {
        method: invoiceId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invoice save failed.");
      }

      if (data.invoice?.id) {
        setInvoiceId(data.invoice.id);
      }

      if (data.invoice?.invoice_no) {
        setInvoiceNo(data.invoice.invoice_no);
      }

      alert("Invoice saved successfully.");
    } catch (err: any) {
      alert(err?.message || "Invoice save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-6 font-semibold text-slate-900 shadow-xl">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Processing invoice...
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
          <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-6 text-white">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Accounts Billing Engine
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight">
                  Invoice Command Desk
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Create, edit, preview, and safely cancel invoices with tenant-secure backend routes.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {invoiceId && !isCancelled && (
                  <button
                    onClick={handleCancelInvoice}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20"
                  >
                    Cancel Invoice
                  </button>
                )}

                <button
                  onClick={addLine}
                  disabled={isCancelled}
                  className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-40"
                >
                  + Add Line
                </button>

                <button
                  onClick={saveInvoice}
                  disabled={isCancelled}
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-40"
                >
                  Save Invoice
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-4 md:p-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              {isCancelled && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800 shadow-inner">
                  🛑 This invoice is cancelled. Further modification is blocked.
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Invoice Header
                </h2>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Invoice No
                    </label>
                    <input
                      value={invoiceNo}
                      readOnly
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono text-slate-700 outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Status
                    </label>
                    <select
                      value={normalizeStatus(status)}
                      disabled={isCancelled}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-50 capitalize"
                    >
                      <option value="draft">Draft</option>
                      <option value="issued">Issued / Sent</option>
                      <option value="paid">Paid</option>
                      <option value="partially_paid">Partially Paid</option>
                      <option value="overdue">Overdue</option>
                      {isCancelled && <option value="cancelled">Cancelled</option>}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      disabled={isCancelled}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      disabled={isCancelled}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Bill To</h2>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Customer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      value={customerName}
                      placeholder="e.g. Al Noor Travels"
                      disabled={isCancelled}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Phone
                    </label>
                    <input
                      value={customerPhone}
                      placeholder="e.g. +92 333 0000000"
                      disabled={isCancelled}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-50"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Billing Address
                    </label>
                    <textarea
                      value={billingAddress}
                      placeholder="Enter operational billing coordinates"
                      disabled={isCancelled}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Invoice Items
                    </h2>
                    <p className="text-sm text-slate-500">
                      Line items are tax-exclusive. Tax is calculated in summary.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-5 py-3">Description</th>
                        <th className="px-5 py-3">Qty</th>
                        <th className="px-5 py-3">Rate</th>
                        <th className="px-5 py-3 text-right">Amount</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {items.map((item) => {
                        const amount = Number(item.qty || 0) * Number(item.rate || 0);

                        return (
                          <tr key={item.id} className="border-t border-slate-100 align-top">
                            <td className="px-5 py-3">
                              <input
                                value={item.description}
                                disabled={isCancelled}
                                onChange={(e) =>
                                  updateItem(item.id, "description", e.target.value)
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-50"
                                placeholder="Service segment specification"
                              />
                            </td>

                            <td className="px-5 py-3">
                              <input
                                type="number"
                                min={1}
                                disabled={isCancelled}
                                value={item.qty}
                                onChange={(e) =>
                                  updateItem(item.id, "qty", Number(e.target.value))
                                }
                                className="w-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-50"
                              />
                            </td>

                            <td className="px-5 py-3">
                              <input
                                type="number"
                                min={0}
                                disabled={isCancelled}
                                value={item.rate}
                                onChange={(e) =>
                                  updateItem(item.id, "rate", Number(e.target.value))
                                }
                                className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-50"
                              />
                            </td>

                            <td className="px-5 py-5 text-right text-sm font-semibold text-slate-900">
                              {formatCurrency(amount)}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => removeLine(item.id)}
                                disabled={isCancelled}
                                className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-40"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
                <textarea
                  value={notes}
                  disabled={isCancelled}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Charges Summary
                </h2>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Tax %
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={isCancelled}
                      value={taxPct}
                      onChange={(e) => setTaxPct(Math.max(Number(e.target.value || 0), 0))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">
                      Discount
                    </label>
                    <input
                      type="number"
                      min={0}
                      disabled={isCancelled}
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(Number(e.target.value || 0), 0))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none disabled:bg-slate-50"
                    />
                  </div>

                  <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(subTotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Tax Amount</span>
                      <span className="font-semibold text-slate-950">
                        {formatCurrency(taxAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Discount</span>
                      <span className="font-semibold text-slate-900">
                        ({formatCurrency(discount)})
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-3">
                      <span className="font-semibold text-slate-900">Grand Total</span>
                      <span className="text-xl font-bold text-emerald-600">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                  Preview Layout
                </h2>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xl font-bold text-slate-900">
                        ARFEEN TRAVEL
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Travel services invoice preview
                      </div>
                    </div>

                    <div
                      className={`rounded-xl px-3 py-2 text-xs font-semibold text-white uppercase ${
                        isCancelled ? "bg-rose-600" : "bg-slate-900"
                      }`}
                    >
                      {status.replace("_", " ")}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <div className="text-slate-500">Invoice No</div>
                      <div className="font-semibold text-slate-900">{invoiceNo}</div>
                    </div>

                    <div>
                      <div className="text-slate-500">Invoice Date</div>
                      <div className="font-semibold text-slate-900">{invoiceDate}</div>
                    </div>

                    <div>
                      <div className="text-slate-500">Bill To</div>
                      <div className="font-semibold text-slate-900">{customerName || "---"}</div>
                    </div>

                    <div>
                      <div className="text-slate-500">Due Date</div>
                      <div className="font-semibold text-slate-900">{dueDate}</div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-white px-3 py-3 text-sm shadow-sm"
                      >
                        <div>
                          <div className="font-medium text-slate-900">
                            {item.description || "Untitled service"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {item.qty} × {formatCurrency(item.rate)}
                          </div>
                        </div>

                        <div className="font-semibold text-slate-900">
                          {formatCurrency(Number(item.qty || 0) * Number(item.rate || 0))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 border-t border-dashed border-slate-300 pt-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Total Settlement</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={saveInvoice}
                disabled={isCancelled}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition shadow-xl shadow-slate-900/10"
              >
                Save Invoice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 font-medium text-slate-600">
          Loading invoice workspace...
        </div>
      }
    >
      <InvoiceFormContent />
    </Suspense>
  );
}