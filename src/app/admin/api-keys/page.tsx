import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ApiKeyRow = {
  id: string;
  key_value: string;
  is_active: boolean;
  created_at: string;
  agent?: {
    name?: string | null;
  } | null;
};

export default async function ApiKeysPage() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return (
      <div className="p-6 text-red-500">
        Supabase server client not configured.
      </div>
    );
  }

  const { data: keys, error } = await supabase
    .from("api_keys")
    .select("id, key_value, is_active, created_at, agent:agent_id (name)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Failed to load API keys: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">API Keys</h1>

      <p className="text-sm text-gray-500">
        Har agent ke liye separate API key, jisse wo apne system se bookings
        create kar sakta hai.
      </p>

      <div className="overflow-x-auto rounded border bg-white p-4 text-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-xs text-gray-500">
              <th className="py-2 pr-4">Agent</th>
              <th className="py-2 pr-4">Key</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Created</th>
            </tr>
          </thead>

          <tbody>
            {(keys as ApiKeyRow[] | null)?.map((k) => (
              <tr key={k.id} className="border-b last:border-0">
                <td className="py-2 pr-4">{k.agent?.name ?? "-"}</td>
                <td className="py-2 pr-4 font-mono text-xs">{k.key_value}</td>
                <td className="py-2 pr-4">
                  {k.is_active ? "Active" : "Inactive"}
                </td>
                <td className="py-2 pr-4 text-xs text-gray-500">
                  {new Date(k.created_at).toLocaleString()}
                </td>
              </tr>
            ))}

            {(!keys || keys.length === 0) && (
              <tr>
                <td className="py-3 text-sm text-gray-500" colSpan={4}>
                  No API keys found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}