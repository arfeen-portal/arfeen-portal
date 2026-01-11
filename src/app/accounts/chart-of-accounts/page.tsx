"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";

type AccountGroupMini = {
  name: string | null;
  type: string | null;
};

type AccountRow = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  currency_code: string;
  group?: AccountGroupMini | null;
};

const PAGE_SIZE = 20;

export default function ChartOfAccountsPage() {
  const supabase = getSupabaseClient();

  const [rows, setRows] = useState<AccountRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      let query = supabase
        .from("acc_accounts")
        .select(
          "id, code, name, is_active, currency_code, group:acc_account_groups(name,type)",
          { count: "exact" }
        )
        .order("code", { ascending: true })
        .range(from, to);

      if (search.trim()) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      if (typeFilter) {
        // supabase typed relationship ko filter direct nahi kar sakte,
        // isliye neeche JS side pe filter karenge
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("ChartOfAccounts error", error);
        setRows([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      // 🔧 TypeScript error fix: group ko normalize kar rahe hain
      const normalized: AccountRow[] = (data || []).map((d: any) => {
        let grp: AccountGroupMini | null = null;

        if (Array.isArray(d.group)) {
          grp = d.group[0] ?? null;
        } else if (d.group && typeof d.group === "object") {
          grp = {
            name: d.group.name ?? null,
            type: d.group.type ?? null,
          };
        }

        return {
          id: d.id,
          code: d.code,
          name: d.name,
          is_active: d.is_active,
          currency_code: d.currency_code,
          group: grp,
        };
      });

      // type filter JS side pe
      const filtered = typeFilter
        ? normalized.filter((r) => r.group?.type === typeFilter)
        : normalized;

      setRows(filtered);
      setTotal(count || filtered.length);
      setLoading(false);
    };

    fetchData();
  }, [supabase, from, to, search, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleExport = () => {
    const header = [
      "Code",
      "Name",
      "Group",
      "Type",
      "Currency",
      "Status",
    ].join(",");

    const lines = rows.map((r) =>
      [
        r.code,
        `"${r.name}"`,
        `"${r.group?.name ?? ""}"`,
        r.group?.type ?? "",
        r.currency_code,
        r.is_active ? "Active" : "Inactive",
      ].join(",")
    );

    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chart-of-accounts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Chart of Accounts</h1>
          <p className="text-sm text-gray-500">
            Data from <code>acc_accounts</code> &amp;{" "}
            <code>acc_account_groups</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 text-xs sm:text-sm rounded border"
          >
            Export CSV
          </button>
          <button className="px-4 py-2 text-xs sm:text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700">
            + Add Account
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="border rounded px-3 py-2 text-sm min-w-[200px]"
          placeholder="Search account name..."
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
        />
        <select
          className="border rounded px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => {
            setPage(0);
            setTypeFilter(e.target.value);
          }}
        >
          <option value="">All Types</option>
          <option value="asset">Assets</option>
          <option value="liability">Liabilities</option>
          <option value="equity">Equity</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>
        {loading && (
          <span className="text-xs text-gray-400 self-center">Loading…</span>
        )}
      </div>

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Code</th>
              <th className="px-3 py-2 text-left font-semibold">Account Name</th>
              <th className="px-3 py-2 text-left font-semibold">Group</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-left font-semibold">Currency</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.code}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">{r.group?.name ?? "-"}</td>
                <td className="px-3 py-2 capitalize">
                  {r.group?.type ?? "-"}
                </td>
                <td className="px-3 py-2">{r.currency_code}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex px-2 py-1 text-[10px] rounded-full ${
                      r.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {r.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-xs text-gray-400"
                >
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Page {page + 1} of {pageCount} • {total} records
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-2 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page + 1 >= pageCount}
            onClick={() =>
              setPage((p) => (p + 1 < pageCount ? p + 1 : p))
            }
            className="px-2 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
