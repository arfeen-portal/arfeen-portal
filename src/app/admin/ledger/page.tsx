import { getLedgerSummary } from "./actions/getLedgerSummary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LedgerSummaryRow = {
  agent_id: string;
  agent_name: string;
  total_debit: number;
  total_credit: number;
  balance: number;
};

export default async function LedgerPage() {
  const rows = (await getLedgerSummary()) as LedgerSummaryRow[];

  return (
    <main className="space-y-5 p-6">
      <h1 className="text-xl font-bold">Ledger Live</h1>

      <table className="min-w-full rounded-xl border bg-white text-sm">
        <thead className="bg-slate-100 text-xs uppercase text-slate-600">
          <tr>
            <th className="p-2 text-left">Agent</th>
            <th className="p-2 text-right">Debit</th>
            <th className="p-2 text-right">Credit</th>
            <th className="p-2 text-right">Balance</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.agent_id} className="border-b last:border-0">
              <td className="p-2">{r.agent_name ?? "-"}</td>
              <td className="p-2 text-right">{r.total_debit ?? 0}</td>
              <td className="p-2 text-right">{r.total_credit ?? 0}</td>
              <td className="p-2 text-right font-semibold">
                {r.balance ?? 0}
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td className="p-3 text-sm text-gray-500" colSpan={4}>
                No ledger records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}