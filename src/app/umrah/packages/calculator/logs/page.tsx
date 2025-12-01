import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function UmrahCalculatorLogsPage() {
  const { data, error } = await supabase
    .from("umrah_calculator_logs")
    .select(
      `
      id,
      preset_id,
      pax_count,
      total_cost,
      total_price,
      currency,
      created_at,
      umrah_calculator_presets ( name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = data || [];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Umrah Calculator Logs</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading logs: {error.message}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No calculator usage yet.</p>
      ) : (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Preset</th>
                <th className="px-3 py-2 text-right">Pax</th>
                <th className="px-3 py-2 text-right">Total cost</th>
                <th className="px-3 py-2 text-right">Total price</th>
                <th className="px-3 py-2 text-left">Currency</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">
                    {r.umrah_calculator_presets?.name || "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.pax_count ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.total_cost != null
                      ? `${r.currency || ""} ${r.total_cost}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.total_price != null
                      ? `${r.currency || ""} ${r.total_price}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2">{r.currency || "—"}</td>
                  <td className="px-3 py-2">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
