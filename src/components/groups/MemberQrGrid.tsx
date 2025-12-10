"use client";

import React from "react";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";

type Member = {
  id: string;
  full_name: string;
  qr_token: string;
};

interface Props {
  groupId: string;
  members: Member[];
}

export function MemberQrGrid({ groupId, members }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-[#001B4D]">
        Group QR Cards
      </h2>
      <p className="text-sm text-gray-500">
        In QR ko print karke har member ko de do. Leader app se scan karega.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => {
          const payload = JSON.stringify({
            t: "attendance",
            group_id: groupId,
            qr_token: m.qr_token,
          });

          return (
            <motion.div
              key={m.id}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-md"
            >
              <div className="mb-2 text-sm font-medium text-[#001B4D]">
                {m.full_name}
              </div>
              <div className="flex justify-center bg-slate-50 rounded-lg p-3">
                <QRCode value={payload} size={120} />
              </div>
              <div className="mt-2 text-[11px] text-gray-400">
                Arfeen Travel • Ziyarat Group
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
