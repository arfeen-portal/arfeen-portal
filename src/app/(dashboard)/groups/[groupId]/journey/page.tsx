"use client";

import { useEffect, useState } from "react";
import { GroupLeaderDashboard } from "@/components/groups/GroupLeaderDashboard";
import { MemberQrGrid } from "@/components/groups/MemberQrGrid";

type Member = {
  id: string;
  full_name: string;
  qr_token: string;
};

export default function JourneyPage({ params }: { params: { groupId: string } }) {
  const groupId = params.groupId;
  const [members, setMembers] = useState<Member[]>([]);
  const [currentSpotId, setCurrentSpotId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/groups/members?group_id=${groupId}`);
      const data = await res.json();
      setMembers(data.members || []);
      setCurrentSpotId(data.currentSpotId || ""); // TODO: apni logic lagao
    };
    load();
  }, [groupId]);

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <GroupLeaderDashboard groupId={groupId} currentSpotId={currentSpotId} />
      <MemberQrGrid groupId={groupId} members={members} />
    </div>
  );
}
