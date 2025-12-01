import { getLedgerSummary } from "./actions/getLedgerSummary";

export default async function LedgerPage() {
  const rows = await getLedgerSummary();

  return (
    <main className="space-y-5">
      <h1 className="text-xl font-bold">Ledger (Live)</h1>

      <table className="min-w-full text-sm bg-white border rounded-xl">
        <thead className="bg-slate-100 text-xs uppercase text-slate-600">
          <tr>
            <th className="p-2">Agent</th>
            <th className="p-2 text-right">Debit</th>
            <th className="p-2 text-right">Credit</th>
            <th className="p-2 text-right">Balance</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.agent_id} className="border-b">
              <td className="p-2">{r.agent_name}</td>
              <td className="p-2 text-right">{r.total_debit}</td>
              <td className="p-2 text-right">{r.total_credit}</td>
              <td className="p-2 text-right font-semibold">
                {r.balance}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
