// app/groups/[groupId]/leaderboard/page.tsx
import { cookies } from "next/headers";
import { getSupabaseClient } from "@/lib/supabaseClient";

type PageProps = {
  params: { groupId: string };
};

export default async function LeaderboardPage({ params }: PageProps) {
  const supabase = getSupabaseClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/groups/${params.groupId}/leaderboard`,
    { cache: "no-store" }
  );
  const json = await res.json();

  if (json.error) {
    return <div className="p-6 text-red-500">{json.error}</div>;
  }

  const leaderboard = json.leaderboard as {
    pilgrim_id: string;
    full_name: string;
    score: number;
  }[];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Ibadat Leaderboard</h1>
      <p className="text-sm text-gray-500 mb-4">
        Points: Salah in Haram (10), Salah in Hotel (3), Umrah (40),
        Tawaf (15), Rawdah (25), Ziyarat (20)
      </p>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Rank</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((row, index) => (
              <tr key={row.pilgrim_id} className="border-t">
                <td className="px-3 py-2">{index + 1}</td>
                <td className="px-3 py-2">{row.full_name}</td>
                <td className="px-3 py-2 text-right font-semibold">
                  {row.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
