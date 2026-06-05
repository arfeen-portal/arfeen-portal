import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgentDashboardPage() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return (
      <main className="p-6">
        <div className="rounded-xl border bg-white p-6">
          Supabase not configured
        </div>
      </main>
    );
  }

  const { data } = await supabase
    .from("agent_ledger_summary")
    .select("*")
    .order("agent_name", { ascending: true });

  const rows = data || [];

  return (
    <main className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">
        Agent Ledger Summary
      </h1>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Agent</th>
              <th className="px-3 py-2 text-right">Total Debit</th>
              <th className="px-3 py-2 text-right">Total Credit</th>
              <th className="px-3 py-2 text-right">Balance</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r: any) => (
              <tr key={r.agent_id} className="border-t">
                <td className="px-3 py-2">
                  {r.agent_name}
                </td>

                <td className="px-3 py-2 text-right">
                  {Number(r.total_debit || 0).toLocaleString()}
                </td>

                <td className="px-3 py-2 text-right">
                  {Number(r.total_credit || 0).toLocaleString()}
                </td>

                <td
                  className={`px-3 py-2 text-right font-semibold ${
                    Number(r.balance || 0) > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {Number(r.balance || 0).toLocaleString()}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-gray-500"
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