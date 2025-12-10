"use client";

import { useEffect, useState } from "react";
import { CertificateShareButton } from "@/components/groups/CertificateShareButton";

type CertificateRow = {
  id: string;
  member_id: string;
  member_name: string;
  issued_at: string | null;
  pdf_public_url: string;
};

export default function GroupCertificatesPage({
  params,
}: {
  params: { groupId: string };
}) {
  const groupId = params.groupId;
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/groups/certificates?group_id=${groupId}`
        );
        const data = await res.json();
        setRows(data.certificates || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [groupId]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-[#001B4D] to-[#12377A] p-5 text-white shadow-lg">
        <h1 className="text-xl font-semibold">Ziyarat Certificates</h1>
        <p className="mt-1 text-xs text-blue-100">
          Har group member ka certificate, ready for download & WhatsApp share.
        </p>
      </div>

      {/* Table / list */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-md">
        {loading ? (
          <div className="animate-pulse text-xs text-gray-400">
            Loading certificates...
          </div>
        ) : rows.length === 0 ? (
          <div className="text-xs text-gray-500">
            Abhi tak koi certificate generate nahi hua.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Member</th>
                  <th className="px-3 py-2">Issued</th>
                  <th className="px-3 py-2">Certificate</th>
                  <th className="px-3 py-2">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.id} className="text-[11px] text-gray-700">
                    <td className="px-3 py-2 font-medium text-[#001B4D]">
                      {row.member_name}
                    </td>
                    <td className="px-3 py-2">
                      {row.issued_at
                        ? new Date(row.issued_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <a
                        href={row.pdf_public_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-[#001B4D] hover:bg-slate-200"
                      >
                        View / Download
                      </a>
                    </td>
                    <td className="px-3 py-2">
                      <CertificateShareButton
                        memberName={row.member_name}
                        certificateUrl={row.pdf_public_url}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
