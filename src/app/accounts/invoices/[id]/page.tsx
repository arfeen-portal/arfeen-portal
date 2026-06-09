"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const TENANT_KEY = "tenant_id";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number(val || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PK");
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || "");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const tenantId =
    typeof window !== "undefined"
      ? localStorage.getItem(TENANT_KEY) || "default"
      : "default";

  const load = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/accounts/invoices/${id}?tenant_id=${encodeURIComponent(tenantId)}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load invoice");

      setData(json);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [id, tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const invoice = data?.invoice;
  const lines = Array.isArray(data?.lines) ? data.lines : [];

  const totals = useMemo(() => {
    const subtotal = lines.reduce(
      (sum: number, line: any) => sum + Number(line.line_total || 0),
      0
    );

    return {
      subtotal,
      balance: Number(invoice?.balance_due ?? invoice?.balance_amount ?? subtotal),
      paid: Math.max(
        0,
        Number(invoice?.total_amount || subtotal) -
          Number(invoice?.balance_due ?? invoice?.balance_amount ?? subtotal)
      ),
    };
  }, [invoice, lines]);

  async function postInvoice() {
    if (!invoice?.id) return;

    const arAccountId = prompt("Enter AR Account ID:");
    const revenueAccountId = prompt("Enter Revenue Account ID:");

    if (!arAccountId || !revenueAccountId) return;

    setPosting(true);

    try {
      const res = await fetch(`/api/accounts/invoices/${id}/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          ar_account_id: arAccountId,
          revenue_account_id: revenueAccountId,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Posting failed");

      await load();
      alert("Invoice posted successfully.");
    } catch (e: any) {
      alert(e.message || "Posting failed");
    } finally {
      setPosting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-10 text-center font-bold text-slate-500">
        Loading invoice...
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="rounded-3xl border border-red-100 bg-white p-8 text-red-700">
          {error || "Invoice not found."}
        </div>
      </div>
    );
  }

  const isPosted = invoice.status === "posted";

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-6">
      <div className="flex items-center justify-between rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
        <div>
          <button
            onClick={() => router.push("/accounts/invoices")}
            className="mb-3 text-sm font-bold text-slate-500 hover:text-slate-900"
          >
            ← Back to invoices
          </button>

          <h1 className="text-3xl font-black text-slate-950">
            {invoice.invoice_no || "Invoice"}
          </h1>

          <div className="mt-3 flex gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-indigo-700">
              {invoice.status || "draft"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {formatDate(invoice.invoice_date)}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/accounts/invoices/${id}/edit`)}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>

          <button
            onClick={postInvoice}
            disabled={posting || isPosted}
            className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {posting ? "Posting..." : isPosted ? "Posted" : "Post to Ledger"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border bg-white p-6">
          <p className="text-xs font-black uppercase text-slate-400">Customer</p>
          <p className="mt-2 text-xl font-black text-slate-900">
            {invoice.customer_name || "—"}
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-6">
          <p className="text-xs font-black uppercase text-slate-400">Total</p>
          <p className="mt-2 text-xl font-black text-slate-900">
            {formatCurrency(Number(invoice.total_amount || totals.subtotal))}
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-6">
          <p className="text-xs font-black uppercase text-slate-400">Paid</p>
          <p className="mt-2 text-xl font-black text-emerald-700">
            {formatCurrency(totals.paid)}
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-6">
          <p className="text-xs font-black uppercase text-slate-400">Balance</p>
          <p className="mt-2 text-xl font-black text-rose-700">
            {formatCurrency(totals.balance)}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border bg-white shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-lg font-black text-slate-950">Invoice Lines</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Description", "Qty", "Unit Price", "Line Total"].map((h) => (
                  <th
                    key={h}
                    className="p-4 text-xs font-black uppercase tracking-widest text-slate-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y">
              {lines.length ? (
                lines.map((line: any) => (
                  <tr key={line.id || line.sort_order} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">
                      {line.description || "—"}
                    </td>
                    <td className="p-4 text-slate-600">{Number(line.qty || 0)}</td>
                    <td className="p-4 text-slate-600">
                      {formatCurrency(Number(line.unit_price || 0))}
                    </td>
                    <td className="p-4 font-black text-slate-950">
                      {formatCurrency(Number(line.line_total || 0))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No invoice lines found.
                  </td>
                </tr>
              )}
            </tbody>

            <tfoot className="bg-slate-50">
              <tr>
                <td colSpan={3} className="p-4 text-right font-black">
                  Total
                </td>
                <td className="p-4 font-black">
                  {formatCurrency(Number(invoice.total_amount || totals.subtotal))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}