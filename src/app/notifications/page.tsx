import { createClient } from "@/utils/supabase/server";

export default async function NotificationsPage() {
  const supabase = createClient();

  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, type, created_at, is_read")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-4">Notifications</h1>
      <div className="space-y-2">
        {data?.map((n) => (
          <div
            key={n.id}
            className={`border rounded-xl p-3 bg-white text-xs ${
              !n.is_read ? "border-blue-500" : ""
            }`}
          >
            <div className="flex justify-between mb-1">
              <span className="font-semibold">{n.title}</span>
              <span className="text-[10px] text-gray-500">
                {new Date(n.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-700">{n.body}</p>
            <p className="text-[10px] text-gray-500 mt-1">
              Type: {n.type} {n.is_read ? "(read)" : "(new)"}
            </p>
          </div>
        )) || (
          <p className="text-xs text-gray-500">No notifications</p>
        )}
      </div>
    </main>
  );
}
