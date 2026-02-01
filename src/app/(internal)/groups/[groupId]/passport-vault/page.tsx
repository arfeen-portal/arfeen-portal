// app/dashboard/groups/[groupId]/passport-vault/page.tsx

import { createClient } from "@supabase/supabase-js";

type PageProps = {
  params: { groupId: string };
};

export default async function PassportVaultPage({ params }: PageProps) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // ✅ BUILD-TIME SAFETY (MOST IMPORTANT)
  if (!supabaseUrl || !serviceRoleKey) {
    return null; // build ke waqt quietly skip
  }

  // ✅ Supabase client INSIDE function (never top-level)
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data } = await supabase
    .from("passport_vault")
    .select(`
      id,
      passport_number,
      passport_image_url,
      visa_image_url,
      expiry_date,
      pilgrim_profiles (
        full_name
      )
    `)
    .eq("pilgrim_profiles.group_trip_id", params.groupId);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Passport Vault</h1>
      <p className="text-sm text-gray-500 mb-4">
        Secure record of all passports and visas for this group.
      </p>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Pilgrim</th>
              <th className="px-3 py-2 text-left">Passport #</th>
              <th className="px-3 py-2 text-left">Expiry</th>
              <th className="px-3 py-2 text-left">Passport Scan</th>
              <th className="px-3 py-2 text-left">Visa Scan</th>
            </tr>
          </thead>

          <tbody>
            {data && data.length > 0 ? (
              data.map((row: any) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">
                    {row.pilgrim_profiles?.full_name ?? "-"}
                  </td>
                  <td className="px-3 py-2">
                    {row.passport_number ?? "-"}
                  </td>
                  <td className="px-3 py-2">
                    {row.expiry_date ?? "-"}
                  </td>
                  <td className="px-3 py-2">
                    {row.passport_image_url ? (
                      <a
                        href={row.passport_image_url}
                        target="_blank"
                        className="text-blue-600 underline"
                      >
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.visa_image_url ? (
                      <a
                        href={row.visa_image_url}
                        target="_blank"
                        className="text-blue-600 underline"
                      >
                        View
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  No records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
