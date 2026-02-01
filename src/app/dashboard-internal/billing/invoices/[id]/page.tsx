'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import Link from 'next/link';

// ----- Supabase client (browser) -----
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

type Invoice = Database['public']['Tables']['invoices']['Row'];
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoiceId = params?.id as string | undefined;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!invoiceId) return;
    setLoading(true);

    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (!invErr && inv) {
      setInvoice(inv as Invoice);

      const { data: itemsData, error: itemsErr } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('id', { ascending: true });

      if (!itemsErr && itemsData) {
        setItems(itemsData as InvoiceItem[]);
      } else if (itemsErr) {
        console.error(itemsErr);
      }
    } else if (invErr) {
      console.error(invErr);
      setErrorMsg('Invoice not found.');
    }

    setLoading(false);
  }, [invoiceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePayOnline = async () => {
    if (!invoice) return;
    setPaying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          tenantId: invoice.tenant_id
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to create payment session');
      }

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Payment error');
    } finally {
      setPaying(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;
    setEmailSending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/invoices/${invoice.id}/email`, {
        method: 'POST'
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send email');
      }

      setSuccessMsg('Invoice email sent to customer.');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Email sending failed');
    } finally {
      setEmailSending(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!invoice) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const payUrl = `${appUrl}/billing/invoices/${invoice.id}`;

    const message = [
      'Assalamu Alaikum,',
      '',
      'Ye aapki invoice hai from Arfeen Travel.',
      `Total: ${(invoice.total_billing || 0).toFixed(2)} ${invoice.billing_currency}`,
      '',
      `View & Pay here: ${payUrl}`
    ].join('\n');

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="px-4 py-6 lg:px-6">
        <p className="text-sm text-slate-500">Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="px-4 py-6 lg:px-6">
        <p className="text-sm text-red-500">{errorMsg || 'Invoice not found.'}</p>
      </div>
    );
  }

  const isPaid = invoice.status?.toLowerCase() === 'paid';

  return (
    <div className="px-4 py-6 lg:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Invoice #{invoice.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-sm text-slate-500">
            Booking Reference:{' '}
            <span className="font-medium text-slate-800">
              {invoice.booking_reference || '-'}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip status={invoice.status || 'draft'} />

          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-sky-900 px-3 py-1.5 text-xs font-medium text-sky-900 hover:bg-sky-900 hover:text-white transition"
          >
            Download PDF
          </a>

          <button
            onClick={handleSendEmail}
            disabled={emailSending}
            className="inline-flex items-center rounded-md border border-emerald-700 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-700 hover:text-white disabled:opacity-60"
          >
            {emailSending ? 'Sending…' : 'Email Invoice'}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center rounded-md border border-green-700 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-700 hover:text-white"
          >
            WhatsApp Link
          </button>

          {!isPaid && (
            <button
              onClick={handlePayOnline}
              disabled={paying}
              className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {paying ? 'Redirecting...' : 'Pay Online'}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMsg}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total (Base)"
          value={Number(invoice.total_base || 0).toFixed(2)}
          suffix={invoice.base_currency}
        />
        <SummaryCard
          label="Total (Billing)"
          value={Number(invoice.total_billing || 0).toFixed(2)}
          suffix={invoice.billing_currency}
          highlight
        />
        <SummaryCard
          label="Conversion Rate"
          value={Number(invoice.conversion_rate || 1).toFixed(4)}
          suffix={`${invoice.billing_currency}/${invoice.base_currency}`}
        />
        <SummaryCard
          label="Status"
          value={invoice.status || 'draft'}
          suffix=""
        />
      </div>

      {/* Customer + Dates */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Customer
          </h2>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-slate-500">Name: </span>
              <span className="font-medium text-slate-800">
                {invoice.customer_name || '-'}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Email: </span>
              <span className="font-medium text-slate-800">
                {invoice.customer_email || '-'}
              </span>
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Dates & Booking
          </h2>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-slate-500">Issue Date: </span>
              <span className="font-medium text-slate-800">
                {invoice.issue_date
                  ? new Date(invoice.issue_date).toLocaleDateString()
                  : '-'}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Due Date: </span>
              <span className="font-medium text-slate-800">
                {invoice.due_date
                  ? new Date(invoice.due_date).toLocaleDateString()
                  : '-'}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Booking Type: </span>
              <span className="font-medium text-slate-800">
                {invoice.booking_type || '-'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Invoice Items
          </h2>
          <span className="text-xs text-slate-500">
            Base Currency: {invoice.base_currency}
          </span>
        </div>
        {items.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No line items.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Unit Price ({invoice.base_currency})
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Total ({invoice.base_currency})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      {item.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {Number(item.quantity || 1)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      {Number(item.unit_price_base || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-semibold">
                      {Number(item.total_base || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-2">
            Notes
          </h2>
          <p className="text-sm text-slate-700 whitespace-pre-line">
            {invoice.notes}
          </p>
        </div>
      )}

      {/* Back link */}
      <div className="pt-2">
        <Link
          href="/billing/invoices"
          className="inline-flex items-center text-xs font-medium text-sky-900 hover:underline"
        >
          ← Back to Invoices
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  suffix,
  highlight
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        highlight
          ? 'border-amber-300 bg-amber-50/70'
          : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900">
        {value}{' '}
        {suffix && (
          <span className="text-xs font-medium text-slate-500">{suffix}</span>
        )}
      </p>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  let bg = 'bg-slate-100';
  let text = 'text-slate-700';
  let label = status;

  if (normalized === 'paid') {
    bg = 'bg-emerald-100';
    text = 'text-emerald-800';
    label = 'Paid';
  } else if (normalized === 'sent') {
    bg = 'bg-sky-100';
    text = 'text-sky-800';
    label = 'Sent';
  } else if (normalized === 'partially_paid') {
    bg = 'bg-amber-100';
    text = 'text-amber-800';
    label = 'Partially Paid';
  } else if (normalized === 'cancelled') {
    bg = 'bg-rose-100';
    text = 'text-rose-800';
    label = 'Cancelled';
  } else if (normalized === 'draft') {
    bg = 'bg-slate-100';
    text = 'text-slate-700';
    label = 'Draft';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  );
}
