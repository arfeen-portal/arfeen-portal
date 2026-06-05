import Link from "next/link";

export const dynamic = "force-dynamic";

async function getEntry(id: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";

  const res = await fetch(`${base}/api/accounting/journal/${id}`, {
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load entry");
  return json;
}

function money(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getEntry(id);
  const entry = data.entry;
  const lines = data.lines || [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
              Journal Detail
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{entry.entry_no}</h1>
            <p className="mt-2 text-sm text-slate-500">
              Complete audit view of the journal transaction.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/accounting/journal"
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Back
            </Link>
            <Link
              href={`/accounting/journal/${id}/edit`}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Edit Entry
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Entry Date</div>
            <div className="mt-1 font-semibold text-slate-900">{entry.entry_date}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Posting Date</div>
            <div className="mt-1 font-semibold text-slate-900">{entry.posting_date}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Reference</div>
            <div className="mt-1 font-semibold text-slate-900">{entry.reference_no || "-"}</div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
            <div className="mt-1 font-semibold text-emerald-700">{entry.status}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">Description</div>
          <div className="mt-1 text-slate-800">{entry.description || "-"}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Journal Lines</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Account</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Debit</th>
                <th className="px-6 py-4">Credit</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line: any, index: number) => (
                <tr key={line.id} className="border-t border-slate-100">
                  <td className="px-6 py-4 text-slate-500">{index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">
                      {line.account?.code} - {line.account?.name}
                    </div>
                    <div className="text-xs text-slate-500">{line.account?.account_type || "-"}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{line.line_description || "-"}</td>
                  <td className="px-6 py-4 font-semibold text-emerald-700">{money(line.debit || 0)}</td>
                  <td className="px-6 py-4 font-semibold text-rose-700">{money(line.credit || 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td className="px-6 py-4" colSpan={3}></td>
                <td className="px-6 py-4 font-bold text-emerald-700">{money(entry.total_debit || 0)}</td>
                <td className="px-6 py-4 font-bold text-rose-700">{money(entry.total_credit || 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}