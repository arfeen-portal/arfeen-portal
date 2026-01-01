import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";
function computeStatus(
  startDate: string | null,
  endDate: string | null,
  completionPercent: number
): "Upcoming" | "In Progress" | "Completed" {
  const today = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (completionPercent >= 90) return "Completed";
  if (end && end < today) return "Completed";
  if (start && start > today) return "Upcoming";
  return "In Progress";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const statusFilter = searchParams.get("status") || "all";

  const supabase = createClient();

  // Base query: groups + related stats
  let query = supabase
    .from("groups")
    .select(
      `
      id,
      name,
      start_date,
      end_date,
      created_at,
      group_stats (
        total_members,
        total_spots,
        total_checkins,
        completion_percent,
        score
      )
    `
    )
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows =
    data?.map((g: any) => {
      const stats = g.group_stats?.[0] || g.group_stats || {};
      const completionPercent = stats?.completion_percent ?? 0;
      const totalMembers = stats?.total_members ?? 0;
      const score = stats?.score ?? completionPercent;

      const status = computeStatus(
        g.start_date,
        g.end_date,
        completionPercent
      );

      return {
        id: g.id,
        name: g.name,
        start_date: g.start_date,
        end_date: g.end_date,
        created_at: g.created_at,
        total_members: totalMembers,
        completion_percent: completionPercent,
        score,
        status,
      };
    }) || [];

  const filtered =
    statusFilter === "all"
      ? rows
      : rows.filter((r) => r.status === statusFilter);

  return NextResponse.json({ groups: filtered });
}
