"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PageProps = {
  params: { groupId: string };
};

type CertificateRow = {
  id: string;
  generated_at: string | null;
  stats_snapshot: any;
  pilgrim_profiles?: { full_name?: string | null } | null;
};

export default function CertificatesPage({ params }: PageProps) {
  const { groupId } = params;

  const [certificates, setCertificates] = useState<CertificateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadCertificates() {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}/certificates`, {
        cache: "no-store",
      });
      const json = await res.json();
      setCertificates(json.certificates || []);
    } catch (e) {
      console.error(e);
      setMsg("Failed to load certificates.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    try {
      setBtnLoading(true);
      setMsg(null);
      const res = await fetch(
        `/api/groups/${groupId}/certificates/generate`,
        { method: "POST" }
      );
      const json = await res.json();

      if (res.ok) {
        setMsg(`Generated/updated: ${json.count} certificates.`);
        await loadCertificates();
      } else {
        setMsg(json.error || "Something went wrong.");
      }
    } catch (e) {
      console.error(e);
      setMsg("Network error.");
    } finally {
      setBtnLoading(false);
    }
  }

  useEffect(() => {
    loadCertificates();
  }, [groupId]);

  return (
    <div className="p-6 space-y-4">
      {/* Header + button */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Group Certificates – {groupId}
          </h1>
          <p className="text-sm text-gray-500">
            Auto spiritual summary for this group.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleGenerate}
            disabled={btnLoading}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
          >
            {btnLoading ? "Generating..." : "Generate / Refresh Certificates"}
          </button>
          {msg && <span className="text-xs text-gray-600">{msg}</span>}
        </div>
      </div>

      {/* Table or loading text */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading certificates...</div>
      ) : (
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Pilgrim</th>
                <th className="px-3 py-2 text-left">Umrah</th>
                <th className="px-3 py-2 text-left">Salah in Haram</th>
                <th className="px-3 py-2 text-left">Tawaf</th>
                <th className="px-3 py-2 text-left">Ziyarat</th>
                <th className="px-3 py-2 text-left">Generated</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((c) => {
                const stats = c.stats_snapshot || {};
                const name =
                  c.pilgrim_profiles?.full_name ||
                  stats.full_name ||
                  "-";

                return (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2">{name}</td>
                    <td className="px-3 py-2">{stats.umrah_count ?? 0}</td>
                    <td className="px-3 py-2">
                      {stats.salah_haram_count ?? 0}
                    </td>
                    <td className="px-3 py-2">
                      {stats.tawaf_count ?? 0}
                    </td>
                    <td className="px-3 py-2">
                      {stats.ziyarat_visit_count ?? 0}
                    </td>
                    <td className="px-3 py-2">
                      {c.generated_at
                        ? new Date(c.generated_at).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/groups/${groupId}/certificates/${c.id}/preview`}
                        className="text-blue-600 underline text-xs"
                      >
                        View / Print
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {certificates.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-4 text-center text-gray-500"
                    colSpan={7}
                  >
                    No certificates yet. Click “Generate Certificates”.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
