// app/groups/[groupId]/ziyarat-missions/page.tsx
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: { groupId: string };
};

export default async function ZiyaratMissionsPage({ params }: PageProps) {
  const supabase = await createClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/ziyarat/${params.groupId}/missions`,
    { cache: "no-store" }
  );
  const json = await res.json();

  const sites = json.sites as any[];
  const checkins = json.checkins as any[];

  // simple count: kitne pilgrims ne mission complete kiya
  const completionMap: Record<string, number> = {};
  for (const c of checkins) {
    completionMap[c.site_id] = (completionMap[c.site_id] || 0) + 1;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Ziyarat Missions</h1>
      <p className="text-sm text-gray-500">
        Har ziyarat spot par auto check-in + badges + points.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {sites.map((site) => (
          <div
            key={site.id}
            className="bg-white border rounded-lg shadow p-4 flex flex-col space-y-1"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">{site.name}</h2>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
                {site.city}
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-3">
              {site.description}
            </p>
            <div className="flex justify-between items-center text-xs pt-2">
              <span>Reward: {site.reward_points} pts</span>
              <span>
                Completed by:{" "}
                {completionMap[site.id] ? completionMap[site.id] : 0} pilgrims
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
