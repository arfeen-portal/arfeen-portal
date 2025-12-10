"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { motion } from "framer-motion";

type Member = {
  id: string;
  full_name: string;
  passport: string | null;
  seat_no: string | null;
  role: string | null;
  is_present: boolean;
};

export default function GroupMembersPage({
  params,
}: {
  params: { groupId: string };
}) {
  const { groupId } = params;
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [currentSpotId, setCurrentSpotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/members?group_id=${groupId}`);
      const data = await res.json();
      setMembers(data.members || []);
      setCurrentSpotId(data.currentSpotId || null);
    } catch (e) {
      console.error(e);
      setMessage("Unable to load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleMarkPresent = async (memberId: string) => {
    if (!currentSpotId) {
      setMessage("No active Ziyarat spot configured.");
      return;
    }

    try {
      setSavingId(memberId);
      setMessage(null);
      const res = await fetch("/api/groups/checkins/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          member_id: memberId,
          spot_id: currentSpotId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to mark present.");
        setSavingId(null);
        return;
      }

      // Update local state
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, is_present: true } : m
        )
      );
      setSavingId(null);
    } catch (e) {
      console.error(e);
      setMessage("Unexpected error while marking present.");
      setSavingId(null);
    }
  };

  const triggerImport = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          const res = await fetch("/api/groups/members/bulk-import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              group_id: groupId,
              rows,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            setMessage(data.error || "Failed to import members.");
          } else {
            setMessage(
              `Imported ${data.inserted} members successfully.`
            );
            await loadMembers();
          }
        } catch (err) {
          console.error(err);
          setMessage("Unexpected error while importing.");
        } finally {
          setImporting(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      },
      error: (err) => {
        console.error(err);
        setMessage("Failed to parse CSV file.");
        setImporting(false);
      },
    });
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-r from-[#001B4D] to-[#12377A] p-5 text-white shadow-lg"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Group Members</h1>
            <p className="mt-1 text-xs text-blue-100">
              Yahan se members list dekhen, CSV se import karein aur manual
              attendance mark karein.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <button
              onClick={() => router.push(`/groups/${groupId}`)}
              className="rounded-full bg-white/10 px-4 py-1.5 font-medium text-blue-50 hover:bg-white/20"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </motion.div>

      {/* Import controls */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-md sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-[11px] text-gray-600">
          <div className="font-semibold text-gray-800">
            CSV Import (optional)
          </div>
          <div>
            Columns allowed:{" "}
            <span className="font-mono">
              full_name / name, passport, seat_no / seat, role
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={triggerImport}
            disabled={importing}
            className="rounded-full bg-[#001B4D] px-4 py-2 text-xs font-medium text-white shadow-md hover:bg-[#12377A] disabled:opacity-60"
          >
            {importing ? "Importing..." : "Import from CSV"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </motion.div>

      {/* Message */}
      {message && (
        <div className="rounded-2xl border border-yellow-100 bg-yellow-50 px-4 py-3 text-[11px] text-yellow-800">
          {message}
        </div>
      )}

      {/* Members table */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-md"
      >
        {loading ? (
          <div className="animate-pulse text-xs text-gray-400">
            Loading members...
          </div>
        ) : members.length === 0 ? (
          <div className="text-xs text-gray-500">
            Abhi tak koi members add nahi hue. CSV import ya manual insert se
            add karein.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="border-b text-[11px] uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Seat</th>
                  <th className="px-3 py-2">Passport</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {members.map((m) => {
                  const isPresent = m.is_present;
                  return (
                    <tr key={m.id} className="text-[11px] text-gray-700">
                      <td className="px-3 py-2 font-medium text-[#001B4D]">
                        {m.full_name}
                      </td>
                      <td className="px-3 py-2">
                        {m.seat_no || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-3 py-2">
                        {m.passport || (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 uppercase">
                        {m.role || "member"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            "inline-flex rounded-full px-3 py-1 text-[10px] font-medium " +
                            (isPresent
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-slate-50 text-slate-600 border border-slate-200")
                          }
                        >
                          {isPresent ? "Present" : "Absent"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          disabled={isPresent || savingId === m.id}
                          onClick={() => handleMarkPresent(m.id)}
                          className="inline-flex items-center rounded-full bg-[#001B4D] px-3 py-1.5 text-[11px] font-medium text-white shadow-md hover:bg-[#12377A] disabled:opacity-50"
                        >
                          {isPresent
                            ? "Already Present"
                            : savingId === m.id
                            ? "Saving..."
                            : "Mark Present"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
