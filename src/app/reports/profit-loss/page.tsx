import { createClient } from "@/utils/supabase/server";

export default async function ProfitLossReportPage() {
  const supabase = createClient();
  const { data } = await supabase.from("v_monthly_pl").select("*");

  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-4">Profit &amp; Loss (Monthly)</h1>
      <div className="border rounded-xl bg-white overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Month</th>
              <th className="text-right px-3 py-2">Revenue</th>
              <th className="text-right px-3 py-2">Expense</th>
              <th className="text-right px-3 py-2">Net Profit</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((row) => (
              <tr key={row.month} className="border-t">
                <td className="px-3 py-2">
                  {new Date(row.month).toLocaleDateString("en-US", {
                    month: "short",
                    year: "2-digit",
                  })}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(row.total_revenue).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(row.total_expense).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(row.net_profit).toLocaleString()}
                </td>
              </tr>
            )) || (
              <tr>
                <td className="px-3 py-2 text-xs text-gray-500" colSpan={4}>
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
