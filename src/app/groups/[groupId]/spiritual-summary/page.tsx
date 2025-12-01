// app/groups/[groupId]/spiritual-summary/page.tsx
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: { groupId: string };
};

export default async function SpiritualSummaryPage({ params }: PageProps) {
  const supabase = await createClient();

  const { data: groupRow } = await supabase
    .from("group_spiritual_summary")
    .select("*")
    .eq("group_trip_id", params.groupId)
    .single();

  const { data: pilgrims } = await supabase
    .from("pilgrim_profiles")
    .select("id, full_name, is_group_leader")
    .eq("group_trip_id", params.groupId);

  if (!groupRow) {
    return <div className="p-6">No data found for this group.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">
          Group Spiritual Summary – {groupRow.group_name}
        </h1>
        <p className="text-sm text-gray-500">
          Total Pilgrims: {groupRow.total_pilgrims}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SummaryCard label="Salah in Masjid al-Haram" value={groupRow.total_salah_haram} />
        <SummaryCard label="Salah in Hotel" value={groupRow.total_salah_hotel} />
        <SummaryCard label="Total Umrahs" value={groupRow.total_umrahs} />
        <SummaryCard label="Tawaf" value={groupRow.total_tawafs} />
        <SummaryCard label="Rawdah Visits" value={groupRow.total_rawdah_visits} />
        <SummaryCard label="Ziyarat Visits" value={groupRow.total_ziyarat_visits} />
      </div>

      {/* Pilgrim list */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-4 py-2 border-b font-semibold">
          Pilgrims in this Group
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Role</th>
            </tr>
          </thead>
          <tbody>
            {pilgrims?.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">{p.full_name}</td>
                <td className="px-3 py-2">
                  {p.is_group_leader ? "Group Leader" : "Pilgrim"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow border p-4 flex flex-col">
      <span className="text-xs text-gray-500 mb-1">{label}</span>
      <span className="text-xl font-bold">{value ?? 0}</span>
    </div>
  );
}
