import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

function generateKey() {
  return "atk_" + randomBytes(16).toString("hex");
}

export default async function ApiKeysPage() {
  const supabase = createClient();

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, key_value, is_active, created_at, agent:agent_id (name)")
    .order("created_at", { ascending: false });

  // NOTE: Next.js server component me directly form action hooks ka use kar sakte ho (app router),
  // lekin yahan simple placeholder UI de raha hoon – tum baad me action add kar lena.

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">API Keys</h1>

      <p className="text-sm text-gray-500">
        Har agent ke liye separate key, jisse wo apne system se booking create
        kar sakta hai.
      </p>

      <div className="card text-sm">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b">
              <th className="py-2">Agent</th>
              <th>Key</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {keys?.map((k: any) => (
              <tr key={k.id} className="border-b last:border-0">
                <td className="py-2">{k.agent?.name || "-"}</td>
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

      {/* Baad me yahan "Generate Key" form laga lena */}
    </div>
  );
}
