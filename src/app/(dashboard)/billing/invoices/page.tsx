'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import Link from 'next/link';

// ----- Supabase client (browser) -----
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

type Invoice = Database['public']['Tables']['invoices']['Row'];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'sent' | 'draft' | 'partially_paid' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('invoices')
        .select(
          `
          id,
          booking_reference,
          booking_type,
          status,
          total_billing,
          billing_currency,
          issue_date,
          due_date
        `
        )
        .order('issue_date', { ascending: false });

      if (!error && data) {
        setInvoices(data as Invoice[]);
      } else {
        console.error(error);
      }

      setLoading(false);
    };

    fetchInvoices();
  }, []);

  // ---- Filtered invoices ----
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Status
      if (statusFilter !== 'all') {
        if ((inv.status || '').toLowerCase() !== statusFilter) return false;
      }

      // Search (id + booking_reference)
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const idMatch = inv.id.toLowerCase().includes(q);
        const refMatch = (inv.booking_reference || '').toLowerCase().includes(q);
        if (!idMatch && !refMatch) return false;
      }

      // Date range (issue_date)
      if (fromDate) {
        const issue = inv.issue_date ? new Date(inv.issue_date) : null;
        if (issue && issue < new Date(fromDate)) return false;
      }
      if (toDate) {
        const issue = inv.issue_date ? new Date(inv.issue_date) : null;
        if (issue && issue > new Date(toDate)) return false;
      }

      return true;
    });
  }, [invoices, statusFilter, search, fromDate, toDate]);

  // ---- CSV Export ----
  const handleExportCSV = () => {
    if (!filteredInvoices.length) return;

    const headers = [
      'Invoice ID',
      'Booking Reference',
      'Booking Type',
      'Status',
      'Total Billing',
      'Billing Currency',
      'Issue Date',
      'Due Date'
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.id,
      inv.booking_reference || '',
      inv.booking_type || '',
      inv.status || '',
      (inv.total_billing || 0).toFixed(2),
      inv.billing_currency,
      inv.issue_date ? new Date(inv.issue_date).toISOString().slice(0, 10) : '',
      inv.due_date ? new Date(inv.due_date).toISOString().slice(0, 10) : ''
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(',')
        )
        .join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoices.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 py-6 lg:px-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Invoices & Billing
          </h1>
          <p className="text-sm text-slate-500">
            Filter, export, and manage auto-generated invoices.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={!filteredInvoices.length}
          className="inline-flex items-center rounded-md bg-sky-900 px-3 py-2 text-xs font-medium text-white hover:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Export CSV / Excel
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          {/* Search */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">
              Search (Invoice ID / Booking Ref)
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. TR-2025-0001"
              className="h-9 rounded-md border border-slate-200 px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="h-9 rounded-md border border-slate-200 px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="sent">Sent</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* From date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">
              From (Issue Date)
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 rounded-md border border-slate-200 px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* To date */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500">
              To (Issue Date)
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 rounded-md border border-slate-200 px-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-medium text-slate-700">
            Invoices
          </span>
          <span className="text-xs text-slate-500">
            Showing {filteredInvoices.length} of {invoices.length}
          </span>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading invoices...</div>
        ) : !filteredInvoices.length ? (
          <div className="p-6 text-sm text-slate-500">
            No invoices match current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Invoice ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Booking Ref
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Issue / Due
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-500">
                      <span className="font-mono text-[11px] truncate max-w-[160px] block">
                        {inv.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      {inv.booking_reference || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {inv.booking_type || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      <span className="font-semibold">
                        {inv.total_billing?.toFixed
                          ? inv.total_billing.toFixed(2)
                          : Number(inv.total_billing || 0).toFixed(2)}
                      </span>{' '}
                      <span className="text-xs text-slate-500">
                        {inv.billing_currency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div className="flex flex-col">
                        <span>
                          {inv.issue_date
                            ? new Date(inv.issue_date).toLocaleDateString()
                            : '-'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Due:{' '}
                          {inv.due_date
                            ? new Date(inv.due_date).toLocaleDateString()
                            : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <StatusBadge status={inv.status || 'draft'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/billing/invoices/${inv.id}`}
                        className="inline-flex items-center rounded-md border border-sky-900 px-3 py-1.5 text-xs font-medium text-sky-900 hover:bg-sky-900 hover:text-white transition"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${bg} ${text}`}
    >
      {label}
    </span>
  );
}
