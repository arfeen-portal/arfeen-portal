"use client";

import { useEffect, useState } from "react";
import { QrPrintSheet } from "@/components/groups/QrPrintSheet";

type Member = {
  id: string;
  full_name: string;
  qr_token: string;
};

export default function GroupQrPrintPage({
  params,
}: {
  params: { groupId: string };
}) {
  const groupId = params.groupId;
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/groups/members?group_id=${groupId}`);
        const data = await res.json();
        setMembers(data.members || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId]);

  if (loading) {
    return (
      <div className="p-4 text-xs text-gray-400">
        Loading members for QR sheet...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 print:p-0">
      <QrPrintSheet groupId={groupId} members={members} />
    </div>
  );
}
