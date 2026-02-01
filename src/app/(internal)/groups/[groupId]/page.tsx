import { GroupNavGrid } from "@/components/groups/GroupNavGrid";

export default function GroupDashboardPage({
  params,
}: {
  params: { groupId: string };
}) {
  const { groupId } = params;

  return (
    <div className="p-4 sm:p-6">
      <GroupNavGrid groupId={groupId} />
    </div>
  );
}
