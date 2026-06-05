"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type VoucherRow = {
  id: string;
  voucher_no?: string | null;
  voucher_date?: string | null;
  description?: string | null;
  reference_no?: string | null;
  status?: string | null;
  total_debit?: number | string | null;
  total_credit?: number | string | null;
};

type Summary = {
  totalDebit: number;
  totalCredit: number;
  balance: number;
  count: number;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const money = (value: number) =>
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
};

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          {Array.from({ length: 9 }).map((__, j) => (
            <td key={j} className="p-4">
              <div className="h-4 rounded-lg bg-slate-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function VouchersPage() {
  const router = useRouter();

  const [rows, setRows] = useState<VoucherRow[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
    count: 0,
  });

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function fetchVouchers() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (search.trim()) params.set("search", search.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      params.set("page", String(pagination.page));
      params.set("pageSize", String(pagination.pageSize));

      const res = await fetch(`/api/accounts/vouchers?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        throw new Error(json.error || "Failed to load vouchers");
      }

      setRows(json.data || []);
      setSummary(
        json.summary || {
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
          count: 0,
        }
      );
      setPagination(
        json.pagination || {
          page: 1,
          pageSize: 25,
          total: 0,
          totalPages: 1,
        }
      );
    } catch (err: any) {
      setRows([]);
      setError(err?.message || "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchVouchers, 350);
    return () => clearTimeout(timer);
  }, [search, statusFilter, pagination.page, pagination.pageSize]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [search, statusFilter]);

  const postedCount = useMemo(
    () => rows.filter((r) => r.status === "posted").length,
    [rows]
  );

  const draftCount = useMemo(
    () => rows.filter((r) => r.status === "draft").length,
    [rows]
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
            Accounts / Voucher Control
          </p>
          <h1 className="text-3xl font-black text-slate-950">Voucher Desk</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage draft, posted, balanced and unbalanced vouchers.
          </p>
        </div>

        <Link
          href="/accounts/vouchers/new"
          className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-indigo-700"
        >
          + New Voucher
        </Link>
      </div>

      <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Page Vouchers
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {summary.count}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Total records {pagination.total}
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Page Debit
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {money(summary.totalDebit)}
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Page Credit
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {money(summary.totalCredit)}
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">
            Page Difference
          </p>
          <p
            className={`mt-2 text-3xl font-black ${
              Math.abs(summary.balance) <= 0.01
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {money(summary.balance)}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Posted {postedCount} · Draft {draftCount}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search voucher no, reference or description..."
            className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
          >
            <option value="all">All Status</option>
            <option value="posted">Posted</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={pagination.pageSize}
            onChange={(e) =>
              setPagination((prev) => ({
                ...prev,
                page: 1,
                pageSize: Number(e.target.value),
              }))
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
        </div>

        {error && (
          <div className="m-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="p-4">Voucher</th>
                <th className="p-4">Date</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Description</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Debit</th>
                <th className="p-4 text-right">Credit</th>
                <th className="p-4 text-right">Difference</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center">
                    <p className="font-black text-slate-700">No vouchers found</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Create your first voucher or change filters.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const debit = Number(r.total_debit || 0);
                  const credit = Number(r.total_credit || 0);
                  const diff = debit - credit;
                  const balanced = Math.abs(diff) <= 0.01;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => router.push(`/accounts/vouchers/${r.id}`)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
                      <td className="p-4 font-black text-slate-900">
                        {r.voucher_no || "—"}
                      </td>
                      <td className="p-4 text-slate-600">
                        {formatDate(r.voucher_date)}
                      </td>
                      <td className="p-4 text-slate-600">
                        {r.reference_no || "—"}
                      </td>
                      <td className="max-w-[320px] truncate p-4 text-slate-600">
                        {r.description || "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-xl px-3 py-1 text-xs font-black uppercase ${
                            r.status === "posted"
                              ? "bg-emerald-100 text-emerald-700"
                              : r.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {r.status || "draft"}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold">
                        {money(debit)}
                      </td>
                      <td className="p-4 text-right font-mono font-bold">
                        {money(credit)}
                      </td>
                      <td
                        className={`p-4 text-right font-mono font-black ${
                          balanced ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {balanced ? "Balanced" : money(diff)}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/accounts/vouchers/${r.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-black text-indigo-600 hover:text-indigo-800"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-bold text-slate-500">
            Page {pagination.page} of {pagination.totalPages} · Total{" "}
            {pagination.total} records
          </p>

          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1 || loading}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.max(prev.page - 1, 1),
                }))
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <button
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.min(prev.page + 1, prev.totalPages),
                }))
              }
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}