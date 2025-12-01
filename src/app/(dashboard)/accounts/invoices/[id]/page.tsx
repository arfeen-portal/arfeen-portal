'use client';

import React, { useEffect, useState } from 'react';

type Invoice = {
  id: string;
  invoice_number: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  notes: string | null;
  customers?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    country: string | null;
  } | null;
  agents?: { name: string | null } | null;
};

type InvoiceItem = {
  id: number;
  line_no: number;
  description: string;
  qty: number;
  unit_price: number;
  amount: number;
};

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/accounts/invoices/detail?id=${params.id}`);
      const json = await res.json();
      setInvoice(json.invoice || null);
      setItems(json.items || []);
      setLoading(false);
    };
    load();
  }, [params.id]);

  if (loading || !invoice) {
    return <div className="p-4 text-sm">Loading invoice...</div>;
  }

  const customer = invoice.customers;
  const agent = invoice.agents;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Invoice {invoice.invoice_number}</h1>
          <p className="text-sm text-muted-foreground">
            Status: <span className="capitalize">{invoice.status}</span>
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center rounded-md bg-black text-white text-xs font-semibold px-4 py-2"
        >
          Print
        </button>
      </div>

      <div className="border rounded-xl bg-white shadow-sm p-6 print:border-none print:shadow-none">
        <div className="flex flex-col md:flex-row md:justify-between gap-6 mb-6">
          <div className="space-y-1 text-xs">
            <div className="font-semibold text-sm">From</div>
            <div>Arfeen Travel Portal</div>
            {/* yahan apna registered address / info add kar sakte ho */}
          </div>

          <div className="space-y-1 text-xs">
            <div className="font-semibold text-sm">Bill To</div>
            <div>{customer?.full_name || '—'}</div>
            {customer?.email && <div>{customer.email}</div>}
            {customer?.phone && <div>{customer.phone}</div>}
            {(customer?.city || customer?.country) && (
              <div>
                {[customer?.city, customer?.country].filter(Boolean).join(', ')}
              </div>
            )}
          </div>

          <div className="space-y-1 text-xs">
            <div>
              <span className="font-semibold">Invoice #:</span> {invoice.invoice_number}
            </div>
            <div>
              <span className="font-semibold">Issued:</span>{' '}
              {new Date(invoice.issued_at).toLocaleDateString()}
            </div>
            {invoice.due_at && (
              <div>
                <span className="font-semibold">Due:</span>{' '}
                {new Date(invoice.due_at).toLocaleDateString()}
              </div>
            )}
            {agent?.name && (
              <div>
                <span className="font-semibold">Agent:</span> {agent.name}
              </div>
            )}
          </div>
        </div>

        <table className="w-full text-xs border-t border-b">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 w-10">#</th>
              <th className="text-left px-3 py-2">Description</th>
              <th className="text-right px-3 py-2 w-16">Qty</th>
              <th className="text-right px-3 py-2 w-24">Unit</th>
              <th className="text-right px-3 py-2 w-24">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-3 text-center text-muted-foreground">
                  No line items.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-3 py-2">{item.line_no}</td>
                  <td className="px-3 py-2">{item.description}</td>
                  <td className="px-3 py-2 text-right">{item.qty}</td>
                  <td className="px-3 py-2 text-right">
                    {invoice.currency} {item.unit_price.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {invoice.currency} {item.amount.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex flex-col md:flex-row md:justify-between gap-4 mt-4 text-xs">
          <div className="max-w-md">
            {invoice.notes && (
              <>
                <div className="font-semibold mb-1">Notes</div>
                <div className="text-muted-foreground whitespace-pre-line">
                  {invoice.notes}
                </div>
              </>
            )}
          </div>

          <div className="min-w-[200px] space-y-1">
            <Row label="Subtotal" value={invoice.subtotal} currency={invoice.currency} />
            <Row label="Tax" value={invoice.tax_amount} currency={invoice.currency} />
            <Row label="Total" value={invoice.total_amount} currency={invoice.currency} bold />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  currency,
  bold,
}: {
  label: string;
  value: number;
  currency: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? 'font-semibold' : ''}>
        {currency} {value.toFixed(2)}
      </span>
    </div>
  );
}
