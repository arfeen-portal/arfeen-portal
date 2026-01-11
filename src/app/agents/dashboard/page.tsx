// src/app/agents/dashboard/page.tsx
import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function AgentDashboardPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("v_agent_ledger_summary")
    .select("*")
    .order("agent_name", { ascending: true });

  const rows = data || [];

  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-4">Agent Ledger Summary</h1>
      <div className="border rounded-xl bg-white overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Agent</th>
              <th className="text-right px-3 py-2">Total Debit</th>
              <th className="text-right px-3 py-2">Total Credit</th>
              <th className="text-right px-3 py-2">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.agent_id} className="border-t">
                <td className="px-3 py-2">{r.agent_name}</td>
                <td className="px-3 py-2 text-right">
                  {Number(r.total_debit).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.total_credit).toLocaleString()}
                </td>
                <td
                  className={
                    "px-3 py-2 text-right " +
                    (Number(r.balance) > 0
                      ? "text-red-600"
                      : "text-green-600")
                  }
                >
                  {Number(r.balance).toLocaleString()}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-2 text-xs text-gray-500"
                  colSpan={4}
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
