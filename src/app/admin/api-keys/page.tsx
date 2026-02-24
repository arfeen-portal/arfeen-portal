import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { randomBytes } from "crypto";

/**
 * Supabase Server Client (SAFE for App Router + Build)
 */
function supabaseBrowser()) {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

function generateKey() {
  return "atk_" + randomBytes(16).toString("hex");
}

export default async function ApiKeysPage() {
  const supabase = supabaseBrowser();));

  const { data: keys, error } = await supabase
    .from("api_keys")
    .select("id, key_value, is_active, created_at, agent:agent_id (name)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load API keys");
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
            {keys?.map((k: any) => (
              <tr key={k.id} className="border-b last:border-0">
                <td className="py-2">{k.agent?.name ?? "-"}</td>
                <td className="font-mono text-xs">{k.key_value}</td>
                <td>{k.is_active ? "Active" : "Inactive"}</td>
                <td className="text-xs text-gray-500">
                  {new Date(k.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Baad me yahan "Generate Key" form laga dena */}
    </div>
  );
}
