import { createClient } from "@/lib/supabase/server";

export default async function AgentLedgerPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const agentId = user?.id;

  const { data: rows } = await supabase
    .from("agent_ledger_view")
    .select("*")
    .eq("agent_id", agentId)
    .order("date", { ascending: false });

  const total =
    rows?.reduce((sum, r: any) => sum + (Number(r.amount) || 0), 0) || 0;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">My Ledger</h1>

      <div className="card flex items-center justify-between">
        <p className="text-sm text-gray-500">Outstanding Balance</p>
        <p className="text-2xl font-bold">{total} SAR</p>
      </div>

      <div className="card max-h-[420px] overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="py-2">Date</th>
              <th>Description</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r: any) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 text-xs text-gray-500">
                  {new Date(r.date).toLocaleDateString()}
                </td>
                <td>{r.description}</td>
                <td className="text-right">
                  {Number(r.amount).toLocaleString()} SAR
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
