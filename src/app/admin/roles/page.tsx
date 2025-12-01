import { supabase } from "@/lib/supabaseClient";

export default async function RolesPage() {
  const { data: roles, error } = await supabase
    .from("portal_roles")
    .select("*")
    .order("code");

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Roles</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading roles: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {roles?.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.code}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  {r.description || "—"}
                </td>
              </tr>
            ))}

            {!roles?.length && !error && (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-3 text-center text-xs text-gray-500"
                >
                  No roles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
