// src/components/groups/GroupLeaderDashboard.tsx
"use client";

import React from "react";

type Props = {
  groupId: string;
   currentSpotId?: string;
};

// 👇 Named export
export function GroupLeaderDashboard({ groupId }: Props) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        Group Leader Dashboard – Group #{groupId}
      </h1>

      <div className="rounded-lg border p-4 bg-white">
        <p className="text-sm text-gray-700">
          Attendance, journey tracking and certificates are available from the
          admin portal. QR scanner feature will be added in the next build with
          a React&nbsp;18 compatible library.
        </p>
      </div>
    </div>
  );
}

// 👇 Default export bhi, taake dono tarah ka import chale
export default GroupLeaderDashboard;
