import { createClient } from "@/lib/supabaseServer";

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
  const supabase = createClient();

  const { data: keys, error } = await supabase
    .from("api_keys")
    .select("id, key_value, is_active, created_at, agent:agent_id (name)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load API keys: " + error.message);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">API Keys</h1>

      <p className="text-sm text-gray-500">
        Har agent ke liye separate API key, jisse wo apne system se bookings
        create kar sakta hai.
      </p>

      <div className="card text-sm">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th>Agent</th>
              <th>Key</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {(keys as ApiKeyRow[] | null)?.map((k) => (
              <tr key={k.id} className="border-b last:border-0">
                <td className="py-2">{k.agent?.name ?? "-"}</td>
                <td className="font-mono text-xs">{k.key_value}</td>
                <td>{k.is_active ? "Active" : "Inactive"}</td>
                <td className="text-xs text-gray-500">
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

      {/* Baad me yahan "Generate Key" form laga dena */}
    </div>
  );
}