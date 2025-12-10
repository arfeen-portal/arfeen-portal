"use client";

import QRCode from "react-qr-code";

type Member = {
  id: string;
  full_name: string;
  qr_token: string;
};

interface Props {
  groupId: string;
  members: Member[];
}

export function QrPrintSheet({ groupId, members }: Props) {
  return (
    <div className="print:bg-white print:p-0">
      {/* Screen-only header */}
      <div className="mb-4 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-lg font-semibold text-[#001B4D]">
            QR Print Sheet
          </h1>
          <p className="text-xs text-gray-500">
            Is page ko print karein, cards cut kar ke har member ko de dein.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="rounded-full bg-[#001B4D] px-4 py-2 text-xs font-medium text-white shadow-md hover:bg-[#12377A]"
        >
          Print A4
        </button>
      </div>

      {/* A4-ish wrapper */}
      <div className="mx-auto max-w-[800px] rounded-xl border border-gray-200 bg-white p-4 shadow-sm print:shadow-none print:border-0 print:max-w-none">
        <div className="mb-4 flex justify-between text-xs text-gray-500">
          <span>Arfeen Travel • Ziyarat Group</span>
          <span>Generated: {new Date().toLocaleDateString()}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {members.map((m) => {
            const payload = JSON.stringify({
              t: "attendance",
              group_id: groupId,
              qr_token: m.qr_token,
            });

            return (
              <div
                key={m.id}
                className="flex flex-col items-center justify-between rounded-lg border border-gray-200 p-3"
              >
                <div className="mb-2 text-center text-[11px] font-semibold text-[#001B4D]">
                  {m.full_name}
                </div>
                <div className="mb-2 rounded-lg bg-slate-50 p-2">
                  <QRCode value={payload} size={120} />
                </div>
                <div className="text-[9px] text-gray-400">
                  Scan for attendance • Arfeen Travel
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
